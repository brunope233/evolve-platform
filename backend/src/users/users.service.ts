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
    return this.usersRepository.createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) { throw new NotFoundException(`User with ID "${id}" not found`); }
    return user;
  }

  // --- BUSCA DE PERFIL COM VERIFICAÇÃO DE FOLLOW ---
  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    // 1. Busca o perfil solicitado
    const userProfile = await this.usersRepository.createQueryBuilder('user')
      .loadRelationCountAndMap('user.followerCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();

    if (!userProfile) { throw new NotFoundException(`User with username "${username}" not found`); }

    let isFollowing = false;

    // 2. Verifica se o usuário logado segue este perfil
    if (currentUserId && currentUserId !== userProfile.id) {
      // Verifica na tabela de junção se (Eu -> Sigo -> Ele)
      const count = await this.usersRepository.createQueryBuilder('u')
        .leftJoin('u.following', 'f')
        .where('u.id = :myId', { myId: currentUserId })
        .andWhere('f.id = :profileId', { profileId: userProfile.id })
        .getCount();

      isFollowing = count > 0;
      
      this.logger.log(`[Check Follow] Usuário ${currentUserId} segue ${userProfile.username}? ${isFollowing}`);
    }
    
    const { password, ...result } = userProfile;
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
      try { await this.uploadService.deleteFile(oldAvatarUrl); }
      catch (error) { console.error('Falha ao deletar avatar antigo do GCS:', error.message); }
    }
    
    delete updatedUser.password;
    return updatedUser;
  }

  // --- LÓGICA BLINDADA DE SEGUIR/DEIXAR DE SEGUIR ---
  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    const targetUser = await this.usersRepository.findOne({ where: { username: ILike(followingUsername) } });
    
    if (!targetUser || followerId === targetUser.id) {
      throw new NotFoundException(`Ação inválida.`);
    }

    // 1. Verifica se já segue
    const count = await this.usersRepository.createQueryBuilder('user')
        .innerJoin('user.following', 'following') // Usa innerJoin para garantir que a relação existe
        .where('user.id = :followerId', { followerId })
        .andWhere('following.id = :targetId', { targetId: targetUser.id })
        .getCount();

    const alreadyFollowing = count > 0;

    if (alreadyFollowing) {
      // REMOVER (Direto na tabela de relação, sem carregar objeto pesado)
      await this.usersRepository.createQueryBuilder()
        .relation(User, 'following')
        .of(followerId)
        .remove(targetUser.id);
        
      this.logger.log(`[Toggle] ${followerId} deixou de seguir ${followingUsername}`);
      return { following: false };
    } else {
      // ADICIONAR (Direto na tabela de relação)
      await this.usersRepository.createQueryBuilder()
        .relation(User, 'following')
        .of(followerId)
        .add(targetUser.id);

      // Notificação (Bloco try/catch para não falhar a request se o socket der erro)
      try {
        const follower = await this.findOneById(followerId);
        await this.notificationsService.createNotification({
          recipient: targetUser,
          sender: follower,
          type: NotificationType.NEW_FOLLOWER,
        });
      } catch (e) {
        this.logger.warn(`Falha ao enviar notificação de follow: ${e.message}`);
      }

      this.logger.log(`[Toggle] ${followerId} começou a seguir ${followingUsername}`);
      return { following: true };
    }
  }
}