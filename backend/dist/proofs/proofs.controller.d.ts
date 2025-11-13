import { ProofsService } from './proofs.service';
import { CreateProofDto } from './dto/create-proof.dto';
import { ProofStatus } from './proof.entity';
export declare class ProofsController {
    private readonly proofsService;
    constructor(proofsService: ProofsService);
    uploadFile(file: any, body: CreateProofDto, req: any): Promise<import("./proof.entity").Proof>;
    remove(id: string, req: any): Promise<void>;
    markAsBestAssist(parentProofId: string, assistId: string, req: any): Promise<import("./proof.entity").Proof>;
    updateProofStatus(id: string, body: {
        status: ProofStatus;
        thumbnailUrl?: string;
    }): Promise<void>;
}
