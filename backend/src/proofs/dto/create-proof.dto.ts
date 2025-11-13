import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateProofDto {
  @IsUUID()
  journeyId: string;

  @IsString()
  @IsOptional()
  title?: string;
  
  @IsString()
  @IsOptional()
  description?: string;
  
  @IsBoolean()
  @IsOptional()
  requestRealTimeSeal?: boolean;

  // MUDANÇA: Novo campo opcional
  @IsUUID()
  @IsOptional()
  parentProofId?: string;
}