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

  @Column({ select: false, nullable: true })
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

  @OneToMany(() => Journey, (journey) => journey.user)
  journeys: Journey[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Support, (support) => support.user)
  supports: Support[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notificationsReceived: Notification[];

  @OneToMany(() => Notification, (notification) => notification.sender)
  notificationsSent: Notification[];

  // --- A CORREÇÃO ESTÁ AQUI ---
  
  // 1. "Quem eu sigo" (Lado Dono) -> CRIA A TABELA 'users_following'
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'users_following', // << NOME EXATO DA NOVA TABELA
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

  // 2. "Quem me segue" (Lado Inverso) -> APONTA PARA A MESMA TABELA
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