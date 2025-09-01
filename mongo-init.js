// MongoDB başlangıç script'i
db = db.getSiblingDB('prim_calculate');

// Veritabanı oluştur
db.createCollection('users');
db.createCollection('sales');
db.createCollection('commissionrates');

// İndeksler oluştur
db.users.createIndex({ "email": 1 }, { unique: true });
db.sales.createIndex({ "date": 1 });
db.sales.createIndex({ "userId": 1 });
db.commissionrates.createIndex({ "userId": 1 }, { unique: true });

print('PrimCalculate veritabanı başarıyla oluşturuldu!');
