import { Proof } from '../proofs/proof.entity';
import { User } from '../users/user.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('supports')
export class Support {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.supports, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Proof, (proof) => proof.supports, { onDelete: 'CASCADE' })
  proof: Proof;
  
  @CreateDateColumn()
  createdAt: Date;
}