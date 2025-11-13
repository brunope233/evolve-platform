import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Comment } from 'src/comments/comment.entity';
import { Journey } from 'src/journeys/journey.entity';
import { Notification } from 'src/notifications/notification.entity';
import { Proof } from 'src/proofs/proof.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // O TypeORM precisa saber onde encontrar os arquivos de entidade compilados (.js) em produção.
    const entitiesPath = isProduction 
      ? [__dirname + '/../**/*.entity.js'] 
      : [__dirname + '/../**/*.entity.ts'];

    if (isProduction) {
      // Configuração para o Cloud SQL em produção
      return {
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST'), // Ex: /cloudsql/PROJECT:REGION:INSTANCE
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        entities: entitiesPath,
        synchronize: false, // Em produção, nunca sincronize automaticamente
        ssl: true, // Adiciona SSL para segurança, pode ser necessário para Cloud SQL
        extra: {
          socketPath: this.configService.get<string>('DB_HOST'), // Usa Unix Socket para conectar
        },
      };
    } else {
      // Configuração para o Docker em desenvolvimento
      return {
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST'),
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        entities: entitiesPath,
        synchronize: true,
      };
    }
  }
}