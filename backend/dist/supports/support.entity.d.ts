import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
export declare class Support {
    id: string;
    user: User;
    proof: Proof;
    createdAt: Date;
}
