import { Journey } from 'src/journeys/journey.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, ManyToMany, JoinTable } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Comment } from 'src/comments/comment.entity';
import { Support } from 'src/supports/support.entity';
import { Notification } from 'src/notifications/notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;
  
  @Column({ nullable: true })
  bio: string;
  
  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Journey, (journey) => journey.user)
  journeys: Journey[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Support, (support) => support.user)
  supports: Support[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[];

  // CORREÇÃO: Removi a duplicação dos nomes de coluna para deixar o TypeORM gerenciá-los
  @ManyToMany(() => User, user => user.following)
  @JoinTable({ name: 'user_followers' })
  followers: User[];

  @ManyToMany(() => User, user => user.followers)
  following: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}