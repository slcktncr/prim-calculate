FROM node:18-alpine

WORKDIR /app

# Package.json dosyalarını kopyala
COPY package*.json ./
COPY client/package*.json ./client/

# Bağımlılıkları yükle
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Kaynak kodları kopyala
COPY . .

# Client'ı build et
RUN cd client && npm run build

# Uploads klasörü oluştur
RUN mkdir -p uploads

# Port'u expose et
EXPOSE 5000

# Uygulamayı başlat
CMD ["npm", "start"]
