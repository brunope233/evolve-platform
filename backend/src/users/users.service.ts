import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
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

  // ... (outros métodos create, findByEmailOrUsername, findOneByEmailForAuth mantêm-se iguais) ...
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

  // --- MÉTODO COM A LÓGICA DE CHECK DE FOLLOW ---
  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    const user = await this.usersRepository.createQueryBuilder('user')
      .loadRelationCountAndMap('user.followerCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();

    if (!user) { throw new NotFoundException(`User with username "${username}" not found`); }

    let isFollowing = false;

    if (currentUserId && currentUserId !== user.id) {
      // Verifica se na lista de seguidores do PERFIL (user.id), existe o USUÁRIO LOGADO (currentUserId)
      const count = await this.usersRepository.createQueryBuilder("user")
        .innerJoin("user.followers", "follower") 
        .where("user.id = :profileId", { profileId: user.id })
        .andWhere("follower.id = :currentUserId", { currentUserId })
        .getCount();
      
      isFollowing = count > 0;
      this.logger.log(`[Service] Check Follow: User ${currentUserId} segue ${user.username}? ${isFollowing} (Count: ${count})`);
    } else {
        this.logger.log(`[Service] Check Follow Padrão (False): CurrentUser: ${currentUserId}, ProfileUser: ${user.id}`);
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
      try { await this.uploadService.deleteFile(oldAvatarUrl); }
      catch (error) { console.error('Falha ao deletar avatar antigo do GCS:', error.message); }
    }
    
    delete updatedUser.password;
    return updatedUser;
  }

  // --- MÉTODO OTIMIZADO PARA TOGGLE FOLLOW ---
  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    const userToFollow = await this.usersRepository.findOne({ where: { username: ILike(followingUsername) } });
    
    if (!userToFollow || followerId === userToFollow.id) {
      throw new NotFoundException(`Usuário não encontrado ou ação inválida.`);
    }
    
    // Lógica otimizada: Verifica se já existe a relação direto no banco
    // Assumindo que a relação é definida no User entity como @ManyToMany(() => User, user => user.followers)
    // E que o lado "proprietário" (que tem o JoinTable) é o 'following'
    
    const queryBuilder = this.usersRepository.createQueryBuilder()
        .relation(User, "following")
        .of(followerId);

    // Carrega APENAS a relação específica se ela existir
    // Infelizmente TypeORM loadMany carrega tudo. Vamos usar raw SQL check se o loadMany for pesado,
    // mas para corrigir o bug agora, vamos garantir a lógica de adição/remoção.

    // Método mais seguro para verificar existência sem carregar lista gigante:
    const count = await this.usersRepository.createQueryBuilder("user")
        .innerJoin("user.following", "following")
        .where("user.id = :followerId", { followerId })
        .andWhere("following.id = :targetId", { targetId: userToFollow.id })
        .getCount();
    
    const alreadyFollowing = count > 0;

    if (alreadyFollowing) {
      await queryBuilder.remove(userToFollow.id);
      this.logger.log(`[Service] ${followerId} deixou de seguir ${followingUsername}`);
      return { following: false };
    } else {
      await queryBuilder.add(userToFollow.id);
      
      const follower = await this.findOneById(followerId);
      await this.notificationsService.createNotification({
        recipient: userToFollow,
        sender: follower,
        type: NotificationType.NEW_FOLLOWER,
      });
      
      this.logger.log(`[Service] ${followerId} começou a seguir ${followingUsername}`);
      return { following: true };
    }
  }
}