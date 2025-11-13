import { Journey } from 'src/journeys/journey.entity';
import { Comment } from 'src/comments/comment.entity';
import { Support } from 'src/supports/support.entity';
import { User } from 'src/users/user.entity';
export declare enum ProofStatus {
    PROCESSING = "PROCESSING",
    READY = "READY",
    FAILED = "FAILED"
}
export declare class Proof {
    id: string;
    title: string;
    description: string;
    originalVideoUrl: string;
    processedVideoUrl: string;
    thumbnailUrl: string;
    status: ProofStatus;
    hasRealTimeSeal: boolean;
    parentProof: Proof;
    assists: Proof[];
    bestAssistId: string;
    journey: Journey;
    user: User;
    comments: Comment[];
    supports: Support[];
    createdAt: Date;
}
