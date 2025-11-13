import { Proof } from 'src/proofs/proof.entity';
import { User } from 'src/users/user.entity';
export declare enum JourneyStatus {
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ABANDONED = "ABANDONED"
}
export declare class Journey {
    id: string;
    title: string;
    description: string;
    status: JourneyStatus;
    tags: string[];
    user: User;
    proofs: Proof[];
    createdAt: Date;
    updatedAt: Date;
}
