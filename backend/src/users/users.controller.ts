import { Controller, Get, Param, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException, ValidationPipe, Req, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuardOptional } from 'src/auth/jwt-auth.guard.optional';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(JwtAuthGuardOptional)
  findOneByUsername(@Param('username') username: string, @Req() req) {
    // [DEBUG LOG] Verifica quem está fazendo a requisição
    // Se vier 'undefined', o token não chegou ou o Guard falhou
    this.logger.log(`[GET Profile] Solicitado perfil de: ${username}`);
    this.logger.log(`[GET Profile] User no Request: ${JSON.stringify(req.user)}`);

    // Tenta pegar userId ou id (fallback)
    const currentUserId = req.user?.userId || req.user?.id;
    
    this.logger.log(`[GET Profile] ID do usuário logado identificado: ${currentUserId}`);

    return this.usersService.findOneByUsername(username, currentUserId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  update(@Request() req, @Body(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    const userId = req.user.userId || req.user.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('profile/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem recebido.');
    }
    const userId = req.user.userId || req.user.id;
    return this.usersService.updateAvatar(userId, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/:username/follow')
  toggleFollow(@Param('username') username: string, @Request() req) {
    const followerId = req.user.userId || req.user.id;
    this.logger.log(`[Toggle Follow] User ${followerId} tentando seguir ${username}`);
    return this.usersService.toggleFollow(followerId, username);
  }
}