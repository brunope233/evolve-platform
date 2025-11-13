import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  bio?: string;

  // No futuro, aqui poderia ter a lógica para atualizar o avatar
  // @IsOptional()
  // @IsUrl()
  // avatarUrl?: string;
}