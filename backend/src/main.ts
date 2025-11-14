import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lista de origens permitidas para o CORS
  const whitelist = [
    'http://localhost:3000', // Para desenvolvimento local com Docker
    'https://evolve-platform-478121.web.app', // A URL do seu frontend em produção
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Permite requisições sem 'origin' (como de apps mobile ou Postman)
      // e requisições da nossa whitelist.
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pela política de CORS'));
      }
    },
    credentials: true, // Permite o envio de cookies (importante para o futuro)
  });

  // Reativamos um ValidationPipe global, mas com uma configuração mais permissiva
  // que não deve mais causar os erros silenciosos.
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      skipMissingProperties: true, // Não falha se propriedades opcionais estiverem faltando
  }));

  app.setGlobalPrefix('api/v1');
  
  await app.listen(3001);
  console.log(`Evolve Backend is running on: ${await app.getUrl()}`);
}
bootstrap();