import { Controller, Get, Param, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException, ValidationPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuardOptional } from 'src/auth/jwt-auth.guard.optional';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(JwtAuthGuardOptional)
  findOneByUsername(@Param('username') username: string, @Req() req) {
    const currentUserId = req.user?.id; 
    return this.usersService.findOneByUsername(username, currentUserId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  update(@Request() req, @Body(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    const userId = req.user.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('profile/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            return callback(new BadRequestException('Apenas imagens são permitidas!'), false);
        }
        callback(null, true);
    },
  }))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem recebido.');
    }
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/:username/follow')
  toggleFollow(@Param('username') username: string, @Request() req) {
    const followerId = req.user.id;
    return this.usersService.toggleFollow(followerId, username);
  }
}