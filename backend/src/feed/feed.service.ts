import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { In, IsNull, Repository } from 'typeorm'; // Importar IsNull

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
  ) {}

  async getFeedForUser(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user || !user.following || user.following.length === 0) {
      return [];
    }

    const followingIds = user.following.map(followedUser => followedUser.id);
    
    const proofs = await this.proofsRepository.find({
      where: {
        // CORREÇÃO: Adiciona a condição para buscar apenas provas principais
        parentProof: IsNull(), 
        // E que pertencem a uma jornada de um usuário que seguimos
        journey: {
          user: {
            id: In(followingIds),
          },
        },
      },
      relations: {
        journey: { user: true },
        user: true, // Garante que o autor da prova seja carregado
        supports: { user: true },
        comments: { user: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return proofs;
  }
}