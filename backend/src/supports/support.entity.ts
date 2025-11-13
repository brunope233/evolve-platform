import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('supports')
export class Support {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relação: Muitos apoios pertencem a um usuário
  @ManyToOne(() => User, (user) => user.supports, { onDelete: 'CASCADE' })
  user: User;

  // Relação: Muitos apoios pertencem a uma prova
  @ManyToOne(() => Proof, (proof) => proof.supports, { onDelete: 'CASCADE' })
  proof: Proof;
  
  @CreateDateColumn()
  createdAt: Date;
} 
