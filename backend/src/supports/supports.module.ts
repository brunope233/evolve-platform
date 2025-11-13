import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Support } from './support.entity';
import { SupportsService } from './supports.service';
import { SupportsController } from './supports.controller';
import { Proof } from 'src/proofs/proof.entity';
import { EventsModule } from 'src/websockets/events.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Support, Proof]),
    EventsModule,
    NotificationsModule,
  ],
  providers: [SupportsService],
  controllers: [SupportsController],
})
export class SupportsModule {}