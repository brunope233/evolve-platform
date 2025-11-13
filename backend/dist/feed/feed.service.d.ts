import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
export declare class FeedService {
    private usersRepository;
    private proofsRepository;
    constructor(usersRepository: Repository<User>, proofsRepository: Repository<Proof>);
    getFeedForUser(userId: string, page?: number, limit?: number): Promise<Proof[]>;
}
