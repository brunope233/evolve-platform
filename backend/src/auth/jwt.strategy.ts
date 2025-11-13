import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Este método é chamado automaticamente pelo Passport após validar o token.
  // O que ele retorna é injetado no objeto `request.user`.
  async validate(payload: { sub: string; username: string }) {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
        throw new UnauthorizedException();
    }
    // Podemos retornar o objeto de usuário completo ou apenas as informações do payload.
    // Retornar o objeto completo pode ser útil para o controle de acesso.
    return user;
  }
} 
