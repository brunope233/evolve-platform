import { Journey } from 'src/journeys/journey.entity';
import { Comment } from 'src/comments/comment.entity';
import { Support } from 'src/supports/support.entity';
import { Notification } from 'src/notifications/notification.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    bio: string;
    avatarUrl: string;
    journeys: Journey[];
    comments: Comment[];
    supports: Support[];
    notifications: Notification[];
    followers: User[];
    following: User[];
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
}
