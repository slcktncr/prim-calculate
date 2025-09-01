const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erişim token\'ı bulunamadı' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token veya kullanıcı aktif değil' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Geçersiz token' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için admin yetkisi gereklidir' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Yetki kontrolü sırasında hata oluştu' 
    });
  }
};

const ownerOrAdminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    // Admin ise her şeye erişebilir
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Kullanıcı sadece kendi verilerine erişebilir
    if (req.params.userId && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Yetki kontrolü sırasında hata oluştu' 
    });
  }
};

module.exports = { auth, adminAuth, ownerOrAdminAuth };
