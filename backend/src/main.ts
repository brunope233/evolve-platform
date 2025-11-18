import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'; // <--- A CORREÇÃO ESTÁ AQUI (Sem o * as)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CACHE BUSTER: VERSÃO 1.7 ---
  console.log("VERSION: 1.7 - FIX COOKIE PARSER IMPORT - 18/11/2025");

  const whitelist = [
    'http://localhost:3000',
    'https://evolve-platform-478121.web.app',
    'https://evolve-platform-478121.us-central1.run.app'
  ];

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Agora vai funcionar corretamente como função
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      skipMissingProperties: true,
  }));

  app.setGlobalPrefix('api/v1');
  
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Evolve Backend is running on port: ${port}`);
}

bootstrap();