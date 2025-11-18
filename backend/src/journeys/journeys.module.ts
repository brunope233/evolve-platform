import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from './journey.entity';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { Proof } from 'src/proofs/proof.entity';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journey, Proof]),
    UploadModule,
  ],
  controllers: [JourneysController],
  providers: [JourneysService],
})
export class JourneysModule {}