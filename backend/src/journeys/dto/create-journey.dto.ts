import { IsNotEmpty, IsString, MinLength, MaxLength, IsArray, IsOptional } from 'class-validator';

export class CreateJourneyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}