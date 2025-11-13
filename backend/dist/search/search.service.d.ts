import { Journey } from 'src/journeys/journey.entity';
import { Repository } from 'typeorm';
export declare class SearchService {
    private journeysRepository;
    constructor(journeysRepository: Repository<Journey>);
    searchJourneys(query: string): Promise<Journey[]>;
}
