import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm'; // ← AQUI ESTÁ O In QUE ESTAVA FALTANDO!!!

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
        parentProof: null,
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

  async getForYouFeed(userId: string, page: number = 1, limit: number = 10): Promise<Proof[]> {
    const userSupports = await this.supportsRepository.find({
      where: { user: { id: userId } },
      relations: ['proof'],
      take: 50,
    });

    const interestLabels = userSupports
      .flatMap((support) => support.proof?.aiLabels || [])
      .filter(Boolean);

    if (interestLabels.length === 0) return [];

    const labelCounts = interestLabels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLabels = Object.keys(labelCounts)
      .sort((a, b) => labelCounts[b] - labelCounts[a])
      .slice(0, 5);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    const followingIds = user?.following?.map((u) => u.id) || [];
    const usersToExclude = [userId, ...followingIds];

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
      .andWhere('proof.aiLabels && :topLabels', { topLabels })
      .orderBy('proof.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return await queryBuilder.getMany();
  }
}