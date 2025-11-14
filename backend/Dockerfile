# Use a Node.js image with Bullseye
FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./

# Instala TODAS as dependências
RUN npm install

COPY . .

# Executa o build
RUN npm run build

# Remove as dependências de desenvolvimento
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/main.js"]