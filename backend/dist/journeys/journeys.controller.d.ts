import { JourneysService } from './journeys.service';
import { UpdateJourneyDto } from './dto/update-journey.dto';
export declare class JourneysController {
    private readonly journeysService;
    constructor(journeysService: JourneysService);
    create(body: any, req: any): Promise<import("./journey.entity").Journey>;
    findAll(page?: number, limit?: number): Promise<{
        items: import("./journey.entity").Journey[];
        meta: any;
    }>;
    findOne(id: string): Promise<import("./journey.entity").Journey>;
    update(id: string, updateJourneyDto: UpdateJourneyDto, req: any): Promise<import("./journey.entity").Journey>;
    remove(id: string, req: any): Promise<void>;
}
