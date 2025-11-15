# Use uma imagem Node.js padrão e robusta
FROM node:18-bullseye

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala TODAS as dependências para garantir que o build funcione
RUN npm install

# Copia o resto do código fonte
COPY . .

# Executa o build para criar a pasta 'dist'
RUN npm run build

# Remove as dependências de desenvolvimento para a imagem final
RUN npm prune --production

# Expõe a porta que a aplicação vai usar
EXPOSE 3001

# O comando para iniciar a aplicação em produção
CMD ["node", "dist/main.js"]