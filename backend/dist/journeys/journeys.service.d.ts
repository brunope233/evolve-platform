import { Repository } from 'typeorm';
import { Journey } from './journey.entity';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { User } from 'src/users/user.entity';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { Proof } from 'src/proofs/proof.entity';
export declare class JourneysService {
    private journeysRepository;
    private proofsRepository;
    constructor(journeysRepository: Repository<Journey>, proofsRepository: Repository<Proof>);
    create(createJourneyDto: CreateJourneyDto, user: User): Promise<Journey>;
    findAll(options: {
        page: number;
        limit: number;
    }): Promise<{
        items: Journey[];
        meta: any;
    }>;
    findOneById(id: string): Promise<Journey>;
    update(id: string, updateJourneyDto: UpdateJourneyDto, user: User): Promise<Journey>;
    remove(id: string, user: User): Promise<void>;
}
