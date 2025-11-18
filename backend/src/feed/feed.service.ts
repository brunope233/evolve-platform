import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';

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

  // ================================
  // Feed dos usuários que você segue
  // ================================
  async getFeedForUser(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user || !user.following || user.following.length === 0) {
      return [];
    }

    const followingIds = user.following.map((followedUser) => followedUser.id);

    const proofs = await this.proofsRepository.find({
      where: {
        parentProof: null, // só proofs raiz (não replies)
        journey: {
          user: {
            id: In(followingIds),
          },
        },
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

  // ================================
  // Feed "Para Você" – algoritmo baseado em interesses (aiLabels)
  // ================================
  async getForYouFeed(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    // 1. Pega os últimos 50 supports do usuário
    const userSupports = await this.supportsRepository.find({
      where: { user: { id: userId } },
      relations: ['proof'],
      take: 50,
    });

    // 2. Extrai todos os aiLabels das proofs que ele apoiou
    const interestLabels = userSupports
      .flatMap((support) => support.proof?.aiLabels || [])
      .filter(Boolean);

    if (interestLabels.length === 0) {
      return [];
    }

    // 3. Conta frequência e pega os 5 labels mais comuns
    const labelCounts = interestLabels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLabels = Object.keys(labelCounts)
      .sort((a, b) => labelCounts[b] - labelCounts[a])
      .slice(0, 5);

    // 4. Monta lista de usuários para excluir (ele mesmo + quem ele segue)
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    const followingIds = user?.following?.map((u) => u.id) || [];
    const usersToExclude = [userId, ...followingIds];

    // 5. QueryBuilder com operador nativo && do PostgreSQL (overlap de arrays)
    const queryBuilder = this.proofsRepository.createQueryBuilder('proof');

    queryBuilder
      .innerJoinAndSelect('proof.journey', 'journey')
      .innerJoinAndSelect('journey.user', 'journeyUser')
      .innerJoinAndSelect('proof.user', 'proofUser')
      .leftJoinAndSelect('proof.supports', 'supports')
      .leftJoinAndSelect('supports.user', 'supportUser')
      .leftJoinAndSelect('proof.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('proof.parentProofId IS NULL')
      .andWhere('proof.userId NOT IN (:...usersToExclude)', { usersToExclude })
      // Operador && = "os arrays têm pelo menos um elemento em comum"
      .andWhere('proof.aiLabels && :topLabels', { topLabels })
      .orderBy('proof.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const proofs = await queryBuilder.getMany();

    return proofs;
  }
}