import { Module } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from './journey.entity';
import { Proof } from 'src/proofs/proof.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journey, Proof])],
  controllers: [JourneysController],
  providers: [JourneysService],
})
export class JourneysModule {}