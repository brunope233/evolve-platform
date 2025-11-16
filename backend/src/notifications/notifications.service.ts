import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from 'src/users/user.entity';
import { EventsGateway } from 'src/websockets/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createNotification(data: {
    recipient: User;
    sender?: User;
    type: NotificationType;
    journeyId?: string;
    proofId?: string;
    suggestedTags?: string[];
  }) {
    // Não notifica o usuário por suas próprias ações
    if (data.sender && data.recipient.id === data.sender.id) {
      return;
    }

    const notification = this.notificationsRepository.create(data);
    const savedNotification = await this.notificationsRepository.save(notification);

    // Busca a notificação completa com a relação 'sender' para enviar via WebSocket
    const fullNotification = await this.notificationsRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['sender'],
    });

    // Cria um payload customizado para o WebSocket, incluindo o ID do destinatário
    const payload = {
        ...fullNotification,
        recipientId: data.recipient.id,
    };

    // Emite o evento para todos, e o cliente decide se a notificação é para ele
    this.eventsGateway.server.emit('new_notification', payload);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(userId: string): Promise<{ success: boolean }> {
    await this.notificationsRepository.update(
      { recipient: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }
}