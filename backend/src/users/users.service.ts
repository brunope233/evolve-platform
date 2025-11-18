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
      // Usamos uma consulta SQL crua e direta para a verificação mais rápida e confiável
      const followRelation = await this.usersRepository.query(
        `SELECT * FROM "user_followers" WHERE "userId_2" = $1 AND "userId_1" = $2`,
        [user.id, currentUserId]
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
    const userToFollow = await this.usersRepository.findOne({ where: { username: ILike(followingUsername) } });
    if (!userToFollow || followerId === userToFollow.id) {
      throw new NotFoundException(`Ação inválida.`);
    }
    
    // Usamos o QueryBuilder para gerenciar a relação, que é o método mais robusto.
    const relation = this.usersRepository.createQueryBuilder()
      .relation(User, "following")
      .of(followerId);
      
    // Verifica se a relação já existe
    const alreadyFollowing = await relation.loadMany().then(users => users.some(u => u.id === userToFollow.id));

    if (alreadyFollowing) {
      // Deixar de seguir
      await relation.remove(userToFollow.id);
      return { following: false };
    } else {
      // Seguir
      await relation.add(userToFollow.id);
      
      const follower = await this.findOneById(followerId);
      await this.notificationsService.createNotification({
        recipient: userToFollow,
        sender: follower,
        type: NotificationType.NEW_FOLLOWER,
      });

      return { following: true };
    }
  }
}