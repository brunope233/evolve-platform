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
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      entities: [User, Journey, Proof, Comment, Support, Notification],
      synchronize: true, 
    };
  }
}