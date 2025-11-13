import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Proof])],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {} 
