import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proof } from 'src/proofs/proof.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';
import { In, Not, Repository, ArrayContains } from 'typeorm';

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

    const followingIds = user.following.map(followedUser => followedUser.id);
    
    const proofs = await this.proofsRepository.find({
      where: {
        parentProof: In([null]),
        journey: {
          user: { id: In(followingIds) },
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
        take: 50, // Analisa os últimos 50 apoios
    });

    const interestLabels = userSupports.flatMap(support => support.proof.aiLabels || []);
    if (interestLabels.length === 0) return [];

    const labelCounts = interestLabels.reduce((acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const topLabels = Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a]).slice(0, 5);
    
    const user = await this.usersRepository.findOne({ where: {id: userId}, relations: ['following']});
    const followingIds = user.following.map(u => u.id);
    const usersToExclude = [userId, ...followingIds];

    const recommendedProofs = await this.proofsRepository.find({
        where: {
            parentProof: In([null]),
            user: { id: Not(In(usersToExclude)) },
            aiLabels: ArrayContains(topLabels)
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