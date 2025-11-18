import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification.entity';
import { UploadService } from 'src/upload/upload.service';
import { extname } from 'path';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(newUser);
    delete savedUser.password;
    return savedUser;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: [{ email: ILike(email) }, { username: ILike(username) }] });
  }
  
  async findOneByEmailForAuth(email: string): Promise<User | undefined> {
    return this.usersRepository.createQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', { email }).addSelect('user.password').getOne();
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return user;
  }

  // --- VERSÃO FINAL: SEM loadRelationCountAndMap ---
  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    // Se este log não aparecer, o código é velho
    this.logger.log(`[DEBUG V2] Buscando perfil: ${username}`); 

    const userProfile = await this.usersRepository.findOne({
        where: { username: ILike(username) },
        relations: ['followers', 'following'] 
    });

    if (!userProfile) { throw new NotFoundException(`User not found`); }

    let isFollowing = false;

    if (currentUserId && currentUserId !== userProfile.id) {
      isFollowing = userProfile.followers.some(f => f.id === currentUserId);
    }
    
    const followerCount = userProfile.followers.length;
    const followingCount = userProfile.following.length;

    const { password, followers, following, ...result } = userProfile;
    
    return { ...result, followerCount, followingCount, isFollowing };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({ id: id, ...updateUserDto });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return this.usersRepository.save(user);
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.findOneById(userId);
    const destination = `avatars/${userId}${extname(file.originalname)}`;
    await this.uploadService.uploadFile(file, destination);
    user.avatarUrl = destination;
    const updatedUser = await this.usersRepository.save(user);
    delete updatedUser.password;
    return updatedUser;
  }

  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    const targetUser = await this.usersRepository.findOne({ 
        where: { username: ILike(followingUsername) },
        relations: ['followers'] 
    });
    
    if (!targetUser || followerId === targetUser.id) throw new NotFoundException(`Ação inválida.`);

    const me = await this.findOneById(followerId);
    const alreadyFollowing = targetUser.followers.some(user => user.id === followerId);

    if (alreadyFollowing) {
      targetUser.followers = targetUser.followers.filter(user => user.id !== followerId);
      await this.usersRepository.save(targetUser);
      return { following: false };
    } else {
      targetUser.followers.push(me);
      await this.usersRepository.save(targetUser);
      try {
        await this.notificationsService.createNotification({
          recipient: targetUser,
          sender: me,
          type: NotificationType.NEW_FOLLOWER,
        });
      } catch (e) {}
      return { following: true };
    }
  }
}