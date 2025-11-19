import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';
import { In, Not, Repository, ArrayContains, IsNull } from 'typeorm'; // Adicionei IsNull

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    @InjectRepository(Support)
    private supportsRepository: Repository<Support>,
  ) {}

  async getFeedForUser(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    // 1. Carrega quem eu sigo
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    // 2. PROTEÇÃO: Se não seguir ninguém, retorna vazio imediatamente (Evita Erro 500)
    if (!user || !user.following || user.following.length === 0) {
      return [];
    }

    const followingIds = user.following.map(followedUser => followedUser.id);
    
    // 3. Busca provas
    const proofs = await this.proofsRepository.find({
      where: {
        parentProof: IsNull(), // Jeito correto de checar nulo
        user: { id: In(followingIds) }, // Agora seguro porque o array não é vazio
      },
      relations: {
        journey: { user: true },
        user: true,
        supports: { user: true },
        comments: { user: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return proofs;
  }

  async getForYouFeed(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    // Logica de recomendação mantida
    const userSupports = await this.supportsRepository.find({
        where: { user: { id: userId } },
        relations: ['proof'],
        take: 50,
    });

    const interestLabels = userSupports.flatMap(support => support.proof.aiLabels || []);
    
    // Se não tiver interesses, retorna vazio ou genérico
    if (interestLabels.length === 0) return [];

    const labelCounts = interestLabels.reduce((acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const topLabels = Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a]).slice(0, 5);
    
    // Carrega quem eu já sigo para não recomendar (opcional)
    const user = await this.usersRepository.findOne({ where: {id: userId}, relations: ['following']});
    
    // Monta lista de exclusão
    const followingIds = user?.following ? user.following.map(u => u.id) : [];
    const usersToExclude = [userId, ...followingIds];

    const recommendedProofs = await this.proofsRepository.find({
        where: {
            parentProof: IsNull(),
            user: { id: Not(In(usersToExclude)) }, // Exclui eu mesmo e quem eu sigo
            aiLabels: ArrayContains(topLabels),
        },
        relations: {
            journey: { user: true },
            user: true,
            supports: { user: true },
            comments: { user: true },
        },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
    });

    return recommendedProofs;
  }
}