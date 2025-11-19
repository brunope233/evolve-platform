import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuardOptional extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // Se houver erro (token inválido) ou não tiver usuário:
    // Retorna null. O código vai tratar como "Visitante".
    if (err || !user) {
      return null;
    }
    
    // Se estiver tudo certo, retorna o usuário logado.
    return user;
  }
}