import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log('--- NOVA CONEXÃO WEBSOCKET RECEBIDA ---');
    try {
      // Log para ver o que está no handshake
      console.log('Handshake auth object:', client.handshake.auth);

      const token = client.handshake.auth.token;
      
      if (token) {
        console.log('Token encontrado no handshake.');
        // Log para ver um pedaço do token e confirmar que não está vazio
        console.log('Token (início):', token.substring(0, 30) + '...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { sub: string };
        const userId = decoded.sub;
        console.log('Token decodificado com sucesso. User ID:', userId);
        
        client.join(`user:${userId}`);
        console.log(`✅ SUCESSO: Cliente ${client.id} entrou na sala user:${userId}`);
      } else {
        console.log(`⚠️ AVISO: Cliente ${client.id} conectado, mas NENHUM token foi encontrado em handshake.auth.`);
      }
    } catch (error) {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('!!! ERRO CRÍTICO NA AUTENTICAÇÃO DO WEBSOCKET !!!');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('Erro:', error.message);
      console.error('Cliente será desconectado.');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }
}