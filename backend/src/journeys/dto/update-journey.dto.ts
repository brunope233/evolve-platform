// echo. > backend/src/journeys/dto/update-journey.dto.ts

import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { JourneyStatus } from '../journey.entity';

export class UpdateJourneyDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(JourneyStatus)
  status?: JourneyStatus;
}