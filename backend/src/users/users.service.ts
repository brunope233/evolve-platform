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
    return this.usersRepository.createQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', { email }).addSelect('user.password').getOne();
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['following'] });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return user;
  }

  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.journeys', 'journeys')
      .leftJoinAndSelect('journeys.user', 'journeyUser')
      .loadRelationCountAndMap('user.followerCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .orderBy('journeys.createdAt', 'DESC')
      .getOne();

    if (!user) { throw new NotFoundException(`User with username "${username}" not found`); }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
        // Usamos uma consulta SQL direta na tabela de junção para a verificação mais confiável
        const followRelation = await this.usersRepository.query(
            `SELECT * FROM "user_followers" WHERE "followerId" = $1 AND "followingId" = $2`,
            [currentUserId, user.id]
        );
        isFollowing = followRelation.length > 0;
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
    await this.uploadService.uploadFile(file, destination);

    user.avatarUrl = destination;
    const updatedUser = await this.usersRepository.save(user);

    if (oldAvatarUrl) {
      try {
        await this.uploadService.deleteFile(oldAvatarUrl);
      } catch (error) {
        console.error('Falha ao deletar avatar antigo do GCS:', error.message);
      }
    }
    
    delete updatedUser.password;
    return updatedUser;
  }

  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    if (!followerId || !followingUsername) { throw new ForbiddenException('Ação inválida.'); }
    
    // Carrega o seguidor com sua lista de 'seguindo'
    const follower = await this.usersRepository.findOne({
        where: { id: followerId },
        relations: ['following']
    });
    const userToFollow = await this.usersRepository.findOne({ where: { username: ILike(followingUsername) } });

    if (!follower || !userToFollow || follower.id === userToFollow.id) {
      throw new NotFoundException(`Ação de seguir inválida.`);
    }

    const isFollowing = follower.following.some(user => user.id === userToFollow.id);

    if (isFollowing) {
      follower.following = follower.following.filter(user => user.id !== userToFollow.id);
    } else {
      follower.following.push(userToFollow);
      await this.notificationsService.createNotification({
        recipient: userToFollow, sender: follower, type: NotificationType.NEW_FOFOLLOWER,
      });
    }
    
    await this.usersRepository.save(follower);
    return { following: !isFollowing };
  }
}