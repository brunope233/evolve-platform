import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuardOptional extends AuthGuard('jwt') {
  // Sobrescreve o método para não lançar erro se o usuário não estiver logado
  handleRequest(err, user, info, context) {
    return user; // Retorna o usuário se encontrado, ou `false`/`null` se não, sem dar erro.
  }
}