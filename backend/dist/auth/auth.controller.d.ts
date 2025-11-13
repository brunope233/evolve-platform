import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        id: string;
        username: string;
        email: string;
        bio: string;
        avatarUrl: string;
        journeys: import("../journeys/journey.entity").Journey[];
        comments: import("../comments/comment.entity").Comment[];
        supports: import("../supports/support.entity").Support[];
        notifications: import("../notifications/notification.entity").Notification[];
        followers: import("../users/user.entity").User[];
        following: import("../users/user.entity").User[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): any;
}
