import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token = null;
          
          // LOG DE DIAGNÓSTICO DE CABEÇALHOS
          // Vamos ver se o Authorization Header está chegando
          const authHeader = request?.headers?.['authorization'];
          
          // Vamos ver se os Cookies estão chegando (Se cookie-parser estiver funcionando)
          const cookies = request?.cookies;

          this.logger.log(`[JWT EXTRACTOR] Headers Auth: ${authHeader ? 'SIM (' + authHeader.substring(0, 15) + '...)' : 'NÃO'}`);
          this.logger.log(`[JWT EXTRACTOR] Cookies presentes: ${cookies ? JSON.stringify(Object.keys(cookies)) : 'NENHUM'}`);

          // 1. Tenta do Cookie
          if (cookies && cookies['token']) {
            token = cookies['token'];
            this.logger.log(`[JWT EXTRACTOR] Token encontrado no Cookie!`);
          }
          
          // 2. Tenta do Header (Sobrescreve cookie se existir, pois headers costumam ser mais recentes)
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            this.logger.log(`[JWT EXTRACTOR] Token encontrado no Header Bearer!`);
          }

          if (!token) {
             this.logger.warn(`[JWT EXTRACTOR] NENHUM TOKEN ENCONTRADO NA REQUISIÇÃO!`);
          }

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'somesupersecretstringforjwt',
    });
  }

  async validate(payload: { sub: string; username: string }) {
    // Se chegou aqui, o token é válido e a assinatura bateu!
    this.logger.log(`[JWT VALIDATE] Token válido para usuário: ${payload.username} (${payload.sub})`);
    
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
        this.logger.error(`[JWT VALIDATE] Usuário do token não existe no banco!`);
        throw new UnauthorizedException();
    }
    return { ...user, userId: user.id };
  }
}