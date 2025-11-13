import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relação: Muitos comentários pertencem a um usuário
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  // Relação: Muitos comentários pertencem a uma prova
  @ManyToOne(() => Proof, (proof) => proof.comments, { onDelete: 'CASCADE' })
  proof: Proof;
} 
