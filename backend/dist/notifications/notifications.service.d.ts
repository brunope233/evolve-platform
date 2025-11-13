import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from 'src/users/user.entity';
import { EventsGateway } from 'src/websockets/events.gateway';
export declare class NotificationsService {
    private notificationsRepository;
    private readonly eventsGateway;
    constructor(notificationsRepository: Repository<Notification>, eventsGateway: EventsGateway);
    createNotification(data: {
        recipient: User;
        sender: User;
        type: NotificationType;
        journeyId?: string;
        proofId?: string;
    }): Promise<void>;
    getNotificationsForUser(userId: string): Promise<Notification[]>;
    markAsRead(userId: string): Promise<{
        success: boolean;
    }>;
}
