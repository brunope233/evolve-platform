# Passo 1: Começar com uma imagem oficial do Node.js v18 Alpine
FROM node:18-alpine

# Passo 2: Instalar o FFmpeg dentro da imagem
# 'apk' é o gerenciador de pacotes do Alpine Linux
RUN apk add --no-cache ffmpeg

# Passo 3: Configurar o resto da nossa aplicação (código que já tínhamos)
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/uploads/thumbnails

CMD ["npm", "run", "start"]