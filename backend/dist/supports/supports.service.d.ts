import { Repository } from 'typeorm';
import { Support } from './support.entity';
import { User } from 'src/users/user.entity';
import { Proof } from 'src/proofs/proof.entity';
import { EventsGateway } from 'src/websockets/events.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
export declare class SupportsService {
    private supportsRepository;
    private proofsRepository;
    private readonly eventsGateway;
    private readonly notificationsService;
    constructor(supportsRepository: Repository<Support>, proofsRepository: Repository<Proof>, eventsGateway: EventsGateway, notificationsService: NotificationsService);
    toggleSupport(proofId: string, user: User): Promise<{
        supported: boolean;
    }>;
}
