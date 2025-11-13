import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    const createUserDto = new CreateUserDto();
    createUserDto.username = body.username;
    createUserDto.email = body.email;
    createUserDto.password = body.password;

    const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
    try {
      await validationPipe.transform(createUserDto, { type: 'body', metatype: CreateUserDto });
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    return this.authService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}