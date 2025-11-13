import { SupportsService } from './supports.service';
export declare class SupportsController {
    private readonly supportsService;
    constructor(supportsService: SupportsService);
    toggleSupport(proofId: string, req: any): Promise<{
        supported: boolean;
    }>;
}
