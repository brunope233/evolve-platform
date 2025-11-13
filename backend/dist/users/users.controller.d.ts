import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findOneByUsername(username: string, req: any): Promise<any>;
    update(req: any, updateUserDto: UpdateUserDto): Promise<import("./user.entity").User>;
    uploadAvatar(req: any, file: any): Promise<import("./user.entity").User>;
    toggleFollow(username: string, req: any): Promise<{
        following: boolean;
    }>;
}
