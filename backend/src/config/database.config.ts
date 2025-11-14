import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // Para a sincronização, vamos ler as variáveis do .env
    return {
      type: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      username: 'postgres', 
      password: 'Rg9""2Kza)7AzD;g',
      database: 'evolve-db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: false,
    };
  }
}