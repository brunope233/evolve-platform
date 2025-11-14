import { Journey } from '../journeys/journey.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Comment } from '../comments/comment.entity';
import { Support } from '../supports/support.entity';
import { User } from '../users/user.entity';

export enum ProofStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Entity('proofs')
export class Proof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  originalVideoUrl: string;

  @Column({ nullable: true })
  processedVideoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'enum', enum: ProofStatus, default: ProofStatus.PROCESSING })
  status: ProofStatus;

  @Column({ default: false })
  hasRealTimeSeal: boolean;

  @ManyToOne(() => Proof, proof => proof.assists, { nullable: true, onDelete: 'SET NULL' })
  parentProof: Proof;

  @OneToMany(() => Proof, proof => proof.parentProof, { cascade: true })
  assists: Proof[];

  @Column({ type: 'uuid', nullable: true })
  bestAssistId: string;
  
  @ManyToOne(() => Journey, (journey) => journey.proofs, { onDelete: 'CASCADE' })
  journey: Journey;

  @ManyToOne(() => User, { eager: true })
  user: User;
  
  @OneToMany(() => Comment, (comment) => comment.proof, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Support, (support) => support.proof, { cascade: true })
  supports: Support[];

  @CreateDateColumn()
  createdAt: Date;
}