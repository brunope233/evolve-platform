import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Em produção, o TypeORM precisa procurar por arquivos .js compilados, não .ts.
    const entitiesPath = isProduction 
      ? [__dirname + '/../**/*.entity.js'] 
      : [__dirname + '/../**/*.entity.ts'];

    if (isProduction) {
      // Configuração para o Cloud SQL em produção (usando Unix Socket)
      return {
        type: 'postgres',
        // O 'host' para Unix Sockets é especificado no 'extra.socketPath'.
        // O TypeORM ainda pode precisar de um valor placeholder aqui, mas não o usará para a conexão.
        // host: 'localhost', 
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        entities: entitiesPath,
        synchronize: false, // NUNCA use true em produção
        extra: {
          // O caminho do socket é o mesmo que passamos para a variável DB_HOST
          socketPath: this.configService.get<string>('DB_HOST'),
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