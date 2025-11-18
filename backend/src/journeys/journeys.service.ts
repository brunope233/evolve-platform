import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository, ILike } from 'typeorm';
import { Journey } from './journey.entity';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { User } from 'src/users/user.entity';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import * as fs from 'fs/promises';
import { join } from 'path';
import { Proof } from 'src/proofs/proof.entity';

@Injectable()
export class JourneysService {
  constructor(
    @InjectRepository(Journey)
    private journeysRepository: Repository<Journey>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
  ) {}

  async create(createJourneyDto: CreateJourneyDto, user: User): Promise<Journey> {
    const journey = this.journeysRepository.create({ ...createJourneyDto, user });
    return this.journeysRepository.save(journey);
  }

  async findAll(options: { page: number; limit: number; authorUsername?: string }): Promise<{ items: Journey[], meta: any }> {
    const { page = 1, limit = 10, authorUsername } = options;
    const skip = (page - 1) * limit;
  
    const queryOptions: FindManyOptions<Journey> = {
        order: { createdAt: 'DESC' },
        relations: ['user'],
        take: limit,
        skip: skip,
        where: {},
    };
  
    if (authorUsername) {
        queryOptions.where = { user: { username: ILike(authorUsername) } };
    }
  
    const [items, totalItems] = await this.journeysRepository.findAndCount(queryOptions);
    const totalPages = Math.ceil(totalItems / limit);
  
    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOneById(id: string): Promise<Journey> {
    const journey = await this.journeysRepository.findOne({
        where: { id: id },
        relations: {
            user: true,
            proofs: {
                user: true,
                comments: { user: true },
                supports: { user: true },
                assists: { user: true },
                parentProof: true,
            },
        },
    });

    if (!journey) { 
      throw new NotFoundException(`Journey with ID "${id}" não encontrada`); 
    }

    if (journey.proofs) {
      const mainProofs = journey.proofs.filter(p => !p.parentProof);
      const assists = journey.proofs.filter(p => p.parentProof);

      mainProofs.forEach(mainProof => {
        mainProof.assists = assists.filter(a => a.parentProof.id === mainProof.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (mainProof.comments) {
            mainProof.comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      });
      
      journey.proofs = mainProofs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return journey;
  }

  async update(id: string, updateJourneyDto: UpdateJourneyDto, user: User): Promise<Journey> {
    const journey = await this.findOneById(id);
    if (journey.user.id !== user.id) { throw new ForbiddenException('You are not allowed to update this journey'); }
    const updatedJourney = Object.assign(journey, updateJourneyDto);
    return this.journeysRepository.save(updatedJourney);
  }

  async remove(id: string, user: User): Promise<void> {
    const journey = await this.journeysRepository.findOne({ 
        where: { id }, 
        relations: {
            user: true,
            proofs: {
                assists: true,
            }
        }
    });
    if (!journey) { throw new NotFoundException(`Jornada com ID "${id}" não encontrada`); }
    if (journey.user.id !== user.id) { throw new ForbiddenException('Você não tem permissão para deletar esta jornada'); }

    if (journey.proofs && journey.proofs.length > 0) {
      const allProofs = journey.proofs.flatMap(p => [p, ...(p.assists || [])]);
      
      for (const proof of allProofs) {
        if (proof.originalVideoUrl) {
            await this.uploadService.deleteFile(proof.originalVideoUrl);
        }
        if (proof.thumbnailUrl) {
            await this.uploadService.deleteFile(proof.thumbnailUrl);
        }
      }
    }
    await this.journeysRepository.remove(journey);
  }
}