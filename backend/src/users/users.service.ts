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

  // --- CRIAÇÃO DE USUÁRIO ---
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(newUser);
    delete savedUser.password;
    return savedUser;
  }

  // --- BUSCAS AUXILIARES ---
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

  // --- BUSCA DE PERFIL PÚBLICO (COM CONTAGEM E STATUS DE FOLLOW) ---
  async findOneByUsername(username: string, currentUserId?: string): Promise<any> {
    // Carrega o perfil com as relações necessárias para contagem precisa
    const userProfile = await this.usersRepository.findOne({
        where: { username: ILike(username) },
        relations: ['followers', 'following'] 
    });

    if (!userProfile) { throw new NotFoundException(`User with username "${username}" not found`); }

    let isFollowing = false;

    // Verifica se o usuário logado está na lista de seguidores deste perfil
    if (currentUserId && currentUserId !== userProfile.id) {
      isFollowing = userProfile.followers.some(follower => follower.id === currentUserId);
      this.logger.log(`[Check Follow] User ${currentUserId} segue ${userProfile.username}? ${isFollowing}`);
    }
    
    // Calcula as contagens baseadas no array carregado (garante sincronia)
    const followerCount = userProfile.followers.length;
    const followingCount = userProfile.following.length;

    // Remove dados sensíveis e listas pesadas antes de retornar
    const { password, followers, following, ...result } = userProfile;
    
    return { 
        ...result, 
        followerCount, 
        followingCount, 
        isFollowing 
    };
  }

  // --- ATUALIZAÇÃO DE DADOS ---
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

  // --- LÓGICA DE SEGUIR / DEIXAR DE SEGUIR (TOGGLE) ---
  async toggleFollow(followerId: string, followingUsername: string): Promise<{ following: boolean }> {
    // 1. Busca o usuário ALVO (quem será seguido) e carrega seus seguidores atuais
    const targetUser = await this.usersRepository.findOne({ 
        where: { username: ILike(followingUsername) },
        relations: ['followers'] 
    });
    
    if (!targetUser || followerId === targetUser.id) {
      throw new NotFoundException(`Ação inválida.`);
    }

    // 2. Busca o usuário ATUAL (quem está seguindo)
    const me = await this.findOneById(followerId);

    // 3. Verifica se EU já estou na lista de seguidores DELE
    const alreadyFollowing = targetUser.followers.some(user => user.id === followerId);

    if (alreadyFollowing) {
      // --- UNFOLLOW (Remover) ---
      this.logger.log(`[Action] ${me.username} deixando de seguir ${targetUser.username}`);
      
      // Filtra a lista removendo o meu ID
      targetUser.followers = targetUser.followers.filter(user => user.id !== followerId);
      
      // O TypeORM vai atualizar a tabela de junção users_following automaticamente
      await this.usersRepository.save(targetUser);
      
      return { following: false };

    } else {
      // --- FOLLOW (Adicionar) ---
      this.logger.log(`[Action] ${me.username} começou a seguir ${targetUser.username}`);
      
      // Adiciona meu objeto de usuário na lista de seguidores dele
      targetUser.followers.push(me);
      
      // O TypeORM insere na tabela de junção users_following automaticamente
      await this.usersRepository.save(targetUser);

      // Envia notificação (Try/Catch para não falhar a requisição se o socket der erro)
      try {
        await this.notificationsService.createNotification({
          recipient: targetUser,
          sender: me,
          type: NotificationType.NEW_FOLLOWER,
        });
      } catch (e) {
        this.logger.warn(`Erro ao notificar follow: ${e.message}`);
      }

      return { following: true };
    }
  }
}