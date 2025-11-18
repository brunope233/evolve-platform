import { Controller, Get, Param, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException, ValidationPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuardOptional } from 'src/auth/jwt-auth.guard.optional'; // Seu nome de guard está correto

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(JwtAuthGuardOptional)
  findOneByUsername(@Param('username') username: string, @Req() req) {
    // CORREÇÃO: Mude de req.user?.id para req.user?.userId
    const currentUserId = req.user?.userId; 
    return this.usersService.findOneByUsername(username, currentUserId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  update(@Request() req, @Body(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    // CORREÇÃO: Mude de req.user.id para req.user.userId
    const userId = req.user.userId;
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('profile/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar', { /* ... suas configurações ... */ }))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem recebido.');
    }
    // CORREÇÃO: Mude de req.user.id para req.user.userId
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/:username/follow')
  toggleFollow(@Param('username') username: string, @Request() req) {
    // CORREÇÃO: Mude de req.user.id para req.user.userId
    const followerId = req.user.userId;
    return this.usersService.toggleFollow(followerId, username);
  }
}