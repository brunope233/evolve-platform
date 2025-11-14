import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const entitiesPath = isProduction 
      ? [__dirname + '/../**/*.entity.js'] 
      : [__dirname + '/../**/*.entity.ts'];

    if (isProduction) {
      // Configuração para o Cloud SQL em produção (usando IP Privado via VPC Connector)
      return {
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST_PRIVATE'), // Usa o IP Privado
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        entities: entitiesPath,
        synchronize: false,
        // Não precisamos mais de 'ssl' ou 'extra: { socketPath }'
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