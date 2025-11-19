FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instala dependências
RUN npm install

COPY . .

# --- LINHA MÁGICA PARA QUEBRAR O CACHE (Mude o horário se precisar) ---
ENV FORCE_BUILD_DATE="2025-11-18-21-35-FIX-JOURNEYS"

# Compila o projeto
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]