import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Journey } from 'src/journeys/journey.entity';
import { Repository, ILike, Brackets } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Journey)
    private journeysRepository: Repository<Journey>,
  ) {}

  async searchJourneys(query: string): Promise<Journey[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    // Usamos o QueryBuilder para construir uma consulta mais complexa e robusta
    const queryBuilder = this.journeysRepository.createQueryBuilder('journey');

    queryBuilder
      .leftJoinAndSelect('journey.user', 'user') // Garante que o usuário seja carregado
      .where(new Brackets(qb => {
        qb.where('journey.title ILIKE :searchTerm', { searchTerm })
          .orWhere('journey.description ILIKE :searchTerm', { searchTerm })
          // MUDANÇA: Converte o array de tags para uma string e busca dentro dela
          .orWhere('array_to_string(journey.tags, \' \') ILIKE :searchTerm', { searchTerm });
      }))
      .orderBy('journey.createdAt', 'DESC');

    return queryBuilder.getMany();
  }
}