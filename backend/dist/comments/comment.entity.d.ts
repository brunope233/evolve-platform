import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
export declare class Comment {
    id: string;
    content: string;
    createdAt: Date;
    user: User;
    proof: Proof;
}
