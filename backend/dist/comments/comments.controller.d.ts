import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    getCommentsForProof(proofId: string): Promise<import("./comment.entity").Comment[]>;
    createComment(proofId: string, createCommentDto: CreateCommentDto, req: any): Promise<import("./comment.entity").Comment>;
    deleteComment(commentId: string, req: any): Promise<void>;
}
