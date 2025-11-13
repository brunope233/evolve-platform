import { Repository } from 'typeorm';
import { Proof, ProofStatus } from './proof.entity';
import { User } from 'src/users/user.entity';
import { CreateProofDto } from './dto/create-proof.dto';
import { JourneysService } from 'src/journeys/journeys.service';
import { EventsGateway } from 'src/websockets/events.gateway';
import { HttpService } from '@nestjs/axios';
import { NotificationsService } from 'src/notifications/notifications.service';
export declare class ProofsService {
    private proofsRepository;
    private journeysService;
    private eventsGateway;
    private readonly httpService;
    private readonly notificationsService;
    constructor(proofsRepository: Repository<Proof>, journeysService: JourneysService, eventsGateway: EventsGateway, httpService: HttpService, notificationsService: NotificationsService);
    create(createProofDto: CreateProofDto, user: User, videoFileName: string): Promise<Proof>;
    updateProofStatus(proofId: string, status: ProofStatus, thumbnailUrl?: string): Promise<void>;
    remove(proofId: string, user: User): Promise<void>;
    markAsBestAssist(parentProofId: string, assistId: string, user: User): Promise<Proof>;
}
