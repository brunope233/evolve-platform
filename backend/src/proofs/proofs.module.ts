import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proof } from './proof.entity';
import { ProofsService } from './proofs.service';
import { ProofsController } from './proofs.controller';
import { JourneysModule } from 'src/journeys/journeys.module';
import { EventsModule } from 'src/websockets/events.module';
import { JourneysService } from 'src/journeys/journeys.service';
import { Journey } from 'src/journeys/journey.entity';
import { HttpModule } from '@nestjs/axios';
import { User } from 'src/users/user.entity';
import { Comment } from 'src/comments/comment.entity';
import { Support } from 'src/supports/support.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proof, Journey, User, Comment, Support]),
    JourneysModule,
    EventsModule,
    HttpModule,
    NotificationsModule,
    UploadModule,
  ],
  controllers: [ProofsController],
  providers: [ProofsService, JourneysService],
})
export class ProofsModule {}