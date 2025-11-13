import { User } from 'src/users/user.entity';
export declare enum NotificationType {
    NEW_FOLLOWER = "NEW_FOLLOWER",
    NEW_COMMENT = "NEW_COMMENT",
    NEW_SUPPORT = "NEW_SUPPORT",
    BEST_ASSIST = "BEST_ASSIST"
}
export declare class Notification {
    id: string;
    type: NotificationType;
    isRead: boolean;
    recipient: User;
    sender: User;
    journeyId?: string;
    proofId?: string;
    commentId?: string;
    createdAt: Date;
}
