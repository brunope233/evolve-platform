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

  // --- CORREÇÃO AQUI: Uso de QueryBuilder para evitar erro 500 ---
  async findAll(options: { page: number; limit: number; authorUsername?: string }): Promise<{ items: Journey[], meta: any }> {
    const { page = 1, limit = 10, authorUsername } = options;
    const skip = (page - 1) * limit;
  
    // Cria a query manualmente para garantir que o JOIN funcione
    const query = this.journeysRepository.createQueryBuilder('journey')
      .leftJoinAndSelect('journey.user', 'user') // Junta com a tabela de usuários
      .orderBy('journey.createdAt', 'DESC')
      .take(limit)
      .skip(skip);
  
    // Filtro seguro por nome de usuário (Case Insensitive)
    if (authorUsername) {
        query.where('LOWER(user.username) = LOWER(:username)', { username: authorUsername });
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
        relations: {
            user: true,
            proofs: {
                user: true,
                comments: { user: true },
                supports: { user: true },
                assists: { user: true }, // Certifique-se que 'assists' existe na entity Proof
                parentProof: true,
            },
        },
    });

    if (!journey) { 
      throw new NotFoundException(`Journey with ID "${id}" não encontrada`); 
    }

    // Ordenação em memória (mantida do seu código original)
    if (journey.proofs) {
      const mainProofs = journey.proofs.filter(p => !p.parentProof);
      const assists = journey.proofs.filter(p => p.parentProof);

      mainProofs.forEach(mainProof => {
        // Verifica se 'assists' existe antes de filtrar
        if (assists.length > 0) {
             mainProof.assists = assists.filter(a => a.parentProof && a.parentProof.id === mainProof.id)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        
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
    // Busca simplificada para remoção
    const journey = await this.journeysRepository.findOne({ 
        where: { id }, 
        relations: ['user', 'proofs'] 
    });

    if (!journey) { throw new NotFoundException(`Jornada com ID "${id}" não encontrada`); }
    if (journey.user.id !== user.id) { throw new ForbiddenException('Você não tem permissão para deletar esta jornada'); }

    if (journey.proofs && journey.proofs.length > 0) {
      // Lógica de limpeza de arquivos
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