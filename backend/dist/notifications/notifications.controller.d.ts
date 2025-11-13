import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<import("./notification.entity").Notification[]>;
    markAsRead(req: any): Promise<{
        success: boolean;
    }>;
}
