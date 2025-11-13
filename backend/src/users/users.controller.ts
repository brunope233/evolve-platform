import { Controller, Get, Param, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException, ValidationPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuardOptional } from 'src/auth/jwt-auth.guard.optional';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(JwtAuthGuardOptional)
  findOneByUsername(@Param('username') username: string, @Req() req) {
    // req.user existirá se um token válido for enviado, caso contrário será nulo
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
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, callback) => {
        const user = req.user as any;
        const filename = `${user.id}${extname(file.originalname)}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            return callback(new BadRequestException('Apenas arquivos de imagem são permitidos!'), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 1024 * 1024 * 5
    }
  }))
  uploadAvatar(@Request() req, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem recebido.');
    }
    return this.usersService.updateAvatar(req.user.id, file.path);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/:username/follow')
  toggleFollow(@Param('username') username: string, @Request() req) {
    const followerId = req.user.id;
    return this.usersService.toggleFollow(followerId, username);
  }
}