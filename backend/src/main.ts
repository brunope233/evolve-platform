import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CACHE BUSTER: FORÇAR ATUALIZAÇÃO DO DEPLOY ---
  console.log("VERSION: 1.6 - FORCING UPDATE - 18/11/2025 - FIX FOLLOWERS");

  // Lista de origens permitidas
  const whitelist = [
    'http://localhost:3000',
    'https://evolve-platform-478121.web.app',
    'https://evolve-platform-478121.us-central1.run.app' // Adicionei o próprio domínio do backend por precaução
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Permite requisições sem 'origin' (mobile/postman) ou da whitelist
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS Blocked origin: ${origin}`); // Log para ajudar a debugar se bloquear
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // OBRIGATÓRIO para cookies funcionarem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // OBRIGATÓRIO: Middleware para ler cookies (Auth via SSR)
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      skipMissingProperties: true,
  }));

  app.setGlobalPrefix('api/v1');
  
  // CORREÇÃO CRÍTICA PARA CLOUD RUN:
  // Deve usar process.env.PORT e ouvir em 0.0.0.0
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Evolve Backend is running on port: ${port}`);
}

bootstrap();