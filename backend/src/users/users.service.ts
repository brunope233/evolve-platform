import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: [{ email: ILike(email) }, { username: ILike(username) }] });
  }
  
  async findOneByEmailForAuth(email: string): Promise<User | undefined> {
    return this.usersRepository.createQueryBuilder('user').where('user.email = :email', { email }).addSelect('user.password').getOne();
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['following'] });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return user;
  }

  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    const user = await this.usersRepository.createQueryBuilder('user').leftJoinAndSelect('user.journeys', 'journeys').leftJoinAndSelect('journeys.user', 'journeyUser').loadRelationCountAndMap('user.followerCount', 'user.followers').loadRelationCountAndMap('user.followingCount', 'user.following').where('LOWER(user.username) = LOWER(:username)', { username }).orderBy('journeys.createdAt', 'DESC').getOne();
    if (!user) { throw new NotFoundException(`User with username "${username}" not found`); }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
        const currentUser = await this.usersRepository.findOne({ where: { id: currentUserId }, relations: ['following'] });
        if (currentUser) { isFollowing = currentUser.following.some(followedUser => followedUser.id === user.id); }
    }
    const { password, ...result } = user;
    return { ...result, isFollowing };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({ id: id, ...updateUserDto });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return this.usersRepository.save(user);
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.findOneById(userId);
    const oldAvatarUrl = user.avatarUrl;
    
    const destination = `avatars/${userId}${extname(file.originalname)}`;
    const publicUrl = await this.uploadService.uploadFile(file, destination);

    user.avatarUrl = publicUrl;
    const updatedUser = await this.usersRepository.save(user);

    if (oldAvatarUrl) {
      try {
        const oldFileName = new URL(oldAvatarUrl).pathname.split('/').pop();
        await this.uploadService.deleteFile(`avatars/${oldFileName}`);
        console.log(`Avatar antigo deletado do GCS: avatars/${oldFileName}`);
      } catch (error) {
        console.error('Falha ao deletar avatar antigo do GCS:', error.message);
      }
    }
    
    delete updatedUser.password;
    return updatedUser;
  }

  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    if (!followerId || !followingUsername) { throw new ForbiddenException('Ação inválida.'); }
    
    const follower = await this.findOneById(followerId);
    const userToFollow = await this.usersRepository.findOne({ where: { username: ILike(followingUsername) } });

    if (!userToFollow || follower.id === userToFollow.id) {
      throw new NotFoundException(`Usuário "${followingUsername}" não encontrado ou ação inválida.`);
    }

    const isFollowing = follower.following.some(user => user.id === userToFollow.id);

    if (isFollowing) {
      follower.following = follower.following.filter(user => user.id !== userToFollow.id);
      await this.usersRepository.save(follower);
      return { following: false };
    } else {
      follower.following.push(userToFollow);
      await this.usersRepository.save(follower);
      await this.notificationsService.createNotification({
        recipient: userToFollow,
        sender: follower,
        type: NotificationType.NEW_FOLLOWER,
      });
      return { following: true };
    }
  }
}