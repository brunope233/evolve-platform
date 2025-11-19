import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journey } from './journey.entity';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { User } from 'src/users/user.entity';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { Proof } from 'src/proofs/proof.entity';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name);

  constructor(
    @InjectRepository(Journey)
    private journeysRepository: Repository<Journey>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    private readonly uploadService: UploadService,
  ) {
    this.logger.log(">>> JOURNEYS SERVICE V3.0 - FORCE UPDATE LOADED <<<");
  }

  async create(createJourneyDto: CreateJourneyDto, user: User): Promise<Journey> {
    const journey = this.journeysRepository.create({ ...createJourneyDto, user });
    return this.journeysRepository.save(journey);
  }

  // --- CORREÇÃO DEFINITIVA PARA PAGINAÇÃO ---
  async findAll(options: { page: number; limit: number; authorUsername?: string }): Promise<{ items: Journey[], meta: any }> {
    
    // 1. Conversão Explícita para Inteiros (Base 10)
    // Isso garante que 'skip' e 'take' sejam números, não importa o que venha na URL
    const page = parseInt(options.page as any, 10) || 1;
    const limit = parseInt(options.limit as any, 10) || 10;
    const skip = (page - 1) * limit;

    this.logger.log(`FindAll Journeys - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    // 2. QueryBuilder (Substitui o findAndCount antigo que estava travando)
    const query = this.journeysRepository.createQueryBuilder('journey')
      .leftJoinAndSelect('journey.user', 'user')
      .orderBy('journey.createdAt', 'DESC')
      .take(limit) 
      .skip(skip); 
  
    if (options.authorUsername) {
        query.where('LOWER(user.username) = LOWER(:username)', { username: options.authorUsername });
    }
  
    const [items, totalItems] = await query.getManyAndCount();
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
        relations: ['user', 'proofs', 'proofs.user', 'proofs.comments', 'proofs.comments.user', 'proofs.supports', 'proofs.supports.user', 'proofs.parentProof'],
    });

    if (!journey) { 
      throw new NotFoundException(`Journey with ID "${id}" não encontrada`); 
    }

    // Lógica de ordenação mantida
    if (journey.proofs) {
      const mainProofs = journey.proofs.filter(p => !p.parentProof);
      const assists = journey.proofs.filter(p => p.parentProof);

      mainProofs.forEach(mainProof => {
        (mainProof as any).assists = assists.filter(a => a.parentProof && a.parentProof.id === mainProof.id)
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
    const journey = await this.journeysRepository.findOne({ where: { id }, relations: ['user', 'proofs'] });
    if (!journey) { throw new NotFoundException(`Jornada não encontrada`); }
    if (journey.user.id !== user.id) { throw new ForbiddenException('Sem permissão'); }

    if (journey.proofs && journey.proofs.length > 0) {
      for (const proof of journey.proofs) {
        // Tenta deletar arquivos sem travar se der erro
        if (proof.originalVideoUrl) try { await this.uploadService.deleteFile(proof.originalVideoUrl); } catch(e) {}
        if (proof.thumbnailUrl) try { await this.uploadService.deleteFile(proof.thumbnailUrl); } catch(e) {}
      }
    }
    await this.journeysRepository.remove(journey);
  }
}