import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  constructor(
    @InjectRepository(Journey)
    private journeysRepository: Repository<Journey>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createJourneyDto: CreateJourneyDto, user: User): Promise<Journey> {
    const journey = this.journeysRepository.create({ ...createJourneyDto, user });
    return this.journeysRepository.save(journey);
  }

  async findAll(options: { page: number; limit: number; authorUsername?: string }): Promise<{ items: Journey[], meta: any }> {
    // --- CORREÇÃO DO ERRO 'SKIP NOT A NUMBER' ---
    // Forçamos a conversão para número, pois da URL vem como string
    const pageNum = Number(options.page) || 1;
    const limitNum = Number(options.limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const authorUsername = options.authorUsername;
  
    // Usando QueryBuilder para evitar conflitos de relação e garantir performance
    const query = this.journeysRepository.createQueryBuilder('journey')
      .leftJoinAndSelect('journey.user', 'user') // Join explícito
      .orderBy('journey.createdAt', 'DESC')
      .take(limitNum) // Passa o número limpo
      .skip(skip);    // Passa o número limpo
  
    if (authorUsername) {
        // Filtro insensível a maiúsculas/minúsculas
        query.where('LOWER(user.username) = LOWER(:username)', { username: authorUsername });
    }
  
    const [items, totalItems] = await query.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limitNum);
  
    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limitNum,
        totalPages,
        currentPage: pageNum,
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
                // assists: { user: true }, // Removido se 'assists' não for relação direta mapeada
                parentProof: true,
            },
        },
    });

    if (!journey) { 
      throw new NotFoundException(`Journey with ID "${id}" não encontrada`); 
    }

    if (journey.proofs) {
      const mainProofs = journey.proofs.filter(p => !p.parentProof);
      // Filtragem simplificada para evitar erros de propriedade undefined
      const assists = journey.proofs.filter(p => p.parentProof);

      mainProofs.forEach(mainProof => {
        // Adiciona assistências manualmente ao objeto se necessário
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
    const journey = await this.journeysRepository.findOne({ 
        where: { id }, 
        relations: ['user', 'proofs'] 
    });

    if (!journey) { throw new NotFoundException(`Jornada não encontrada`); }
    if (journey.user.id !== user.id) { throw new ForbiddenException('Sem permissão'); }

    if (journey.proofs && journey.proofs.length > 0) {
      for (const proof of journey.proofs) {
        if (proof.originalVideoUrl) {
            try { await this.uploadService.deleteFile(proof.originalVideoUrl); } catch(e) {}
        }
        if (proof.thumbnailUrl) {
            try { await this.uploadService.deleteFile(proof.thumbnailUrl); } catch(e) {}
        }
      }
    }
    await this.journeysRepository.remove(journey);
  }
}