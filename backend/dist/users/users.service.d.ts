import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
export declare class UsersService {
    private usersRepository;
    private readonly notificationsService;
    constructor(usersRepository: Repository<User>, notificationsService: NotificationsService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findByEmailOrUsername(email: string, username: string): Promise<User | undefined>;
    findOneByEmailForAuth(email: string): Promise<User | undefined>;
    findOneById(id: string): Promise<User>;
    findOneByUsername(username: string, currentUserId?: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    updateAvatar(userId: string, avatarPath: string): Promise<User>;
    toggleFollow(followerId: string, followingUsername: string): Promise<{
        following: boolean;
    }>;
}
