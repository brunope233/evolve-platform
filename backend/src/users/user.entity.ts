import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, ManyToMany, JoinTable } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Journey } from '../journeys/journey.entity';
import { Comment } from '../comments/comment.entity';
import { Support } from '../supports/support.entity';
import { Notification } from '../notifications/notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true }) // select: false protege a senha nas buscas
  password: string;
  
  @Column({ nullable: true })
  bio: string;
  
  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- RELACIONAMENTOS ---

  // Verifique se na sua entidade Journey a propriedade se chama 'user' ou 'author'. 
  // Mantive 'user' conforme seu snippet, mas se der erro, mude para 'author'.
  @OneToMany(() => Journey, (journey) => journey.user)
  journeys: Journey[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Support, (support) => support.user)
  supports: Support[];

  // Notificações Recebidas
  @OneToMany(() => Notification, (notification) => notification.recipient)
  notificationsReceived: Notification[];

  // Notificações Enviadas (Importante para o sistema saber quem gerou a notificação)
  @OneToMany(() => Notification, (notification) => notification.sender)
  notificationsSent: Notification[];

  // --- SISTEMA DE FOLLOW (CORRIGIDO) ---

  // LADO PROPRIETÁRIO: "Quem eu sigo"
  // O @JoinTable TEM QUE FICAR AQUI para o typeorm saber onde salvar.
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'users_following', // Nome da tabela no banco
    joinColumn: {
      name: 'followerId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId',
      referencedColumnName: 'id',
    },
  })
  following: User[];

  // LADO INVERSO: "Quem me segue"
  // Não tem @JoinTable aqui, ele espelha o de cima.
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  // --- HOOKS ---

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}