import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lista de origens permitidas
  const whitelist = [
    'http://localhost:3000', // Para desenvolvimento local
    'https://evolve-platform-478121.web.app', // A URL do seu frontend em produção
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Permite requisições sem 'origin' (como de apps mobile ou Postman)
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pela política de CORS'));
      }
    },
  });

  app.setGlobalPrefix('api/v1');
  
  await app.listen(3001);
  console.log(`Evolve Backend is running on: ${await app.getUrl()}`);
}
bootstrap();