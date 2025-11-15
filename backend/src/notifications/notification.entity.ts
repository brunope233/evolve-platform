import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_SUPPORT = 'NEW_SUPPORT',
  BEST_ASSIST = 'BEST_ASSIST',
  TAG_SUGGESTION = 'TAG_SUGGESTION', // Novo tipo
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  // O 'sender' pode ser nulo para notificações do sistema, como esta
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  sender: User;

  // Novo campo para armazenar as tags
  @Column('text', { array: true, nullable: true })
  suggestedTags: string[];

  @Column({ nullable: true })
  journeyId?: string;

  @Column({ nullable: true })
  proofId?: string;

  @Column({ nullable: true })
  commentId?: string;

  @CreateDateColumn()
  createdAt: Date;
}