import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(createUserDto: CreateUserDto): Promise<{
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
    validateUser(email: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
}
