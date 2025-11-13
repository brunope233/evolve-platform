import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from 'src/journeys/journey.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Journey])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {} 
