import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_SUPPORT = 'NEW_SUPPORT',
  BEST_ASSIST = 'BEST_ASSIST',
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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column({ nullable: true })
  journeyId?: string;

  @Column({ nullable: true })
  proofId?: string;

  @Column({ nullable: true })
  commentId?: string;

  @CreateDateColumn()
  createdAt: Date;
}