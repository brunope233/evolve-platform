import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/users/user.entity';
import { Proof } from 'src/proofs/proof.entity';
import { EventsGateway } from 'src/websockets/events.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
export declare class CommentsService {
    private commentsRepository;
    private proofsRepository;
    private readonly eventsGateway;
    private readonly notificationsService;
    constructor(commentsRepository: Repository<Comment>, proofsRepository: Repository<Proof>, eventsGateway: EventsGateway, notificationsService: NotificationsService);
    getCommentsForProof(proofId: string): Promise<Comment[]>;
    createComment(proofId: string, createCommentDto: CreateCommentDto, user: User): Promise<Comment>;
    deleteComment(commentId: string, user: User): Promise<void>;
}
