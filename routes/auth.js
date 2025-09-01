const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    await user.save();

    // Token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Son giriş tarihini güncelle
    user.lastLogin = new Date();
    await user.save();

    // Token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında hata oluştu',
      error: error.message
    });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınırken hata oluştu',
      error: error.message
    });
  }
});

// Admin: Tüm kullanıcıları listele
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Admin: Kullanıcı durumunu değiştir
router.patch('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı durumu güncellendi',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Admin: Kullanıcı düzenle
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;

    // Email çakışması kontrolü (kendi email'i hariç)
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Admin: İlk admin kullanıcısını oluştur
router.post('/setup-admin', async (req, res) => {
  try {
    // Sadece hiç admin yoksa oluştur
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin kullanıcısı zaten mevcut. Bu işlem artık yapılamaz.'
      });
    }

    // Rate limiting: 1 dakikada maksimum 3 deneme
    const clientIP = req.ip || req.connection.remoteAddress;
    const attempts = req.app.locals.setupAttempts = req.app.locals.setupAttempts || {};
    
    if (attempts[clientIP] && attempts[clientIP].count >= 3 && 
        Date.now() - attempts[clientIP].firstAttempt < 60000) {
      return res.status(429).json({
        success: false,
        message: 'Çok fazla deneme yapıldı. Lütfen 1 dakika bekleyin.'
      });
    }

    // Deneme sayısını kaydet
    if (!attempts[clientIP]) {
      attempts[clientIP] = { count: 1, firstAttempt: Date.now() };
    } else {
      attempts[clientIP].count++;
    }

    const { firstName, lastName, email, password } = req.body;

    // Şifre güvenlik kontrolü
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 8 karakter olmalıdır'
      });
    }

    const adminUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'admin'
    });

    await adminUser.save();

    const token = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Başarılı kurulum sonrası deneme sayısını sıfırla
    delete attempts[clientIP];

    res.status(201).json({
      success: true,
      message: 'Admin kullanıcısı başarıyla oluşturuldu',
      data: {
        user: adminUser,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin kullanıcısı oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Admin hesabının var olup olmadığını kontrol et
router.get('/check-admin-exists', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({
      success: true,
      adminExists: adminCount > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin kontrolü yapılırken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
