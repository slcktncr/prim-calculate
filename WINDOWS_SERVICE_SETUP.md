# PrimCalculate Windows Servis Kurulum Kılavuzu

## 🚀 Otomatik Başlatma Sistemi

Bu kılavuz, PrimCalculate sistemini Windows'ta otomatik olarak çalışan bir servis haline getirmeyi açıklar.

## 📋 Gereksinimler

- Windows 10/11
- Yönetici yetkisi
- Node.js kurulu
- MongoDB kurulu
- MongoDB Compass kurulu

## 🔧 Kurulum Adımları

### **1. Servis Kurulumu (Önerilen Yöntem)**

#### **A) Batch Script ile Kurulum:**
```cmd
# PowerShell'i "Yönetici olarak çalıştır" ile açın
# Proje klasörüne gidin
cd "C:\Users\Selcuk Tuncer\Desktop\PrimCalculate"

# Servis kurulum script'ini çalıştırın
install-service.bat
```

#### **B) PowerShell Script ile Kurulum:**
```powershell
# PowerShell'i "Yönetici olarak çalıştır" ile açın
# Execution Policy'yi ayarlayın
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Servis kurulum script'ini çalıştırın
.\install-service.ps1
```

### **2. Otomatik Başlatma Ayarları**

#### **A) Registry ile Otomatik Başlatma:**
```cmd
# setup-startup.reg dosyasına çift tıklayın
# "Evet" diyerek registry'ye ekleyin
```

#### **B) Manuel Registry Ayarları:**
```cmd
# Windows + R tuşlarına basın
# regedit yazın ve Enter'a basın
# Aşağıdaki yolu bulun:
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run

# Yeni String Value ekleyin:
# Name: PrimCalculate
# Value: "C:\Users\Selcuk Tuncer\Desktop\PrimCalculate\startup.bat"
```

### **3. MongoDB Compass Otomatik Başlatma**

```cmd
# MongoDB Compass'ı otomatik başlatmak için:
start-compass.bat
```

## 🎯 Sistem Başlangıcında Ne Olur?

1. **Windows başlar**
2. **MongoDB servisi otomatik başlar**
3. **PrimCalculate servisi otomatik başlar**
4. **MongoDB Compass otomatik açılır**
5. **Tarayıcıda uygulama otomatik açılır**
6. **Sistem tamamen hazır olur**

## 🛠️ Servis Yönetimi

### **Servis Durumu Kontrolü:**
```cmd
# Servis durumunu kontrol et
sc query PrimCalculate

# PowerShell ile
Get-Service PrimCalculate
```

### **Servisi Manuel Başlatma:**
```cmd
# Servisi başlat
net start PrimCalculate

# PowerShell ile
Start-Service PrimCalculate
```

### **Servisi Manuel Durdurma:**
```cmd
# Servisi durdur
net stop PrimCalculate

# PowerShell ile
Stop-Service PrimCalculate
```

### **Servisi Kaldırma:**
```cmd
# Servisi kaldır
uninstall-service.bat

# Manuel kaldırma
nssm remove PrimCalculate confirm
```

## 📁 Oluşturulan Dosyalar

- `install-service.bat` - Servis kurulum script'i
- `uninstall-service.bat` - Servis kaldırma script'i
- `start-compass.bat` - MongoDB Compass başlatma
- `startup.bat` - Otomatik başlatma script'i
- `install-service.ps1` - PowerShell servis kurulum
- `setup-startup.reg` - Registry ayarları
- `logs/` - Log dosyaları klasörü

## 🔍 Log Dosyaları

- `logs/service.log` - Servis çalışma logları
- `logs/service-error.log` - Servis hata logları
- `logs/startup.log` - Başlangıç logları

## ⚠️ Sorun Giderme

### **Servis Başlamıyorsa:**
1. Event Viewer'da hata mesajlarını kontrol edin
2. Log dosyalarını inceleyin
3. MongoDB servisinin çalıştığından emin olun
4. Node.js'in kurulu olduğunu kontrol edin

### **MongoDB Compass Açılmıyorsa:**
1. MongoDB Compass'ın kurulu olduğunu kontrol edin
2. MongoDB servisinin çalıştığını kontrol edin
3. Port 27017'nin açık olduğunu kontrol edin

### **Uygulama Açılmıyorsa:**
1. Port 5000'nin açık olduğunu kontrol edin
2. Firewall ayarlarını kontrol edin
3. Servis loglarını inceleyin

## 🎉 Başarılı Kurulum Sonrası

- ✅ Sistem her başlangıçta otomatik çalışır
- ✅ MongoDB otomatik başlar
- ✅ PrimCalculate sunucusu otomatik başlar
- ✅ MongoDB Compass otomatik açılır
- ✅ Tarayıcıda uygulama otomatik açılır
- ✅ Manuel komut girmeye gerek kalmaz

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. Event Viewer'da hata mesajlarını arayın
3. Servis durumunu kontrol edin
4. Gerekirse servisi yeniden başlatın

---

**Not:** Bu kurulum yönetici yetkisi gerektirir. Güvenlik için sadece güvendiğiniz sistemlerde kullanın.
