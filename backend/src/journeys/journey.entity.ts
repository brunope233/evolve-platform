import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';

export enum JourneyStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

@Entity('journeys')
export class Journey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: JourneyStatus,
    default: JourneyStatus.IN_PROGRESS,
  })
  status: JourneyStatus;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @ManyToOne(() => User, (user) => user.journeys, { eager: true })
  user: User;

  @OneToMany(() => Proof, (proof) => proof.journey, { cascade: true })
  proofs: Proof[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}