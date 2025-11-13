import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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

  async findAll(options: { page: number; limit: number }): Promise<{ items: Journey[], meta: any }> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;
    const [items, totalItems] = await this.journeysRepository.findAndCount({
      order: { createdAt: 'DESC' }, relations: ['user'], take: limit, skip: skip,
    });
    const totalPages = Math.ceil(totalItems / limit);
    return { items, meta: { totalItems, itemCount: items.length, itemsPerPage: limit, totalPages, currentPage: page }};
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
      // Ordena todas as provas pela data de criação
      journey.proofs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Separa as provas principais das respostas (assists)
      const mainProofs = journey.proofs.filter(p => !p.parentProof);
      const assists = journey.proofs.filter(p => p.parentProof);

      // Reatribui os assists aos seus pais corretos
      mainProofs.forEach(mainProof => {
        mainProof.assists = assists.filter(a => a.parentProof.id === mainProof.id);
        // Ordena os assists de cada prova principal
        if (mainProof.assists) {
            mainProof.assists.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      });

      // Substitui a lista de provas da jornada apenas pelas provas principais, já com seus assists aninhados
      journey.proofs = mainProofs;
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
    // Busca a jornada com TODAS as provas, incluindo assists aninhados, para garantir que todos os arquivos sejam deletados
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
      // Constrói uma lista plana de todas as provas (principais + assists) para deletar os arquivos
      const allProofs = journey.proofs.flatMap(p => [p, ...(p.assists || [])]);
      
      for (const proof of allProofs) {
        if (proof.originalVideoUrl) {
            const filePath = join(process.cwd(), proof.originalVideoUrl);
            try { await fs.unlink(filePath); } catch (error) { console.error(error); }
        }
        if (proof.thumbnailUrl) {
            const thumbPath = join(process.cwd(), proof.thumbnailUrl);
            try { await fs.unlink(thumbPath); } catch (error) { console.error(error); }
        }
      }
    }
    // A deleção da jornada em si vai deletar em cascata todas as provas e suas relações no DB
    await this.journeysRepository.remove(journey);
  }
}