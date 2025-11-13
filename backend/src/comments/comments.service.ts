import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/users/user.entity';
import { Proof } from 'src/proofs/proof.entity';
import { EventsGateway } from 'src/websockets/events.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getCommentsForProof(proofId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { proof: { id: proofId } },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }

  async createComment(proofId: string, createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const proof = await this.proofsRepository.findOne({
      where: { id: proofId },
      relations: ['journey', 'journey.user'],
    });
    if (!proof) { throw new NotFoundException(`Prova com ID "${proofId}" não encontrada.`); }

    const newComment = this.commentsRepository.create({
      content: createCommentDto.content,
      user: user,
      proof: proof,
    });
    const savedComment = await this.commentsRepository.save(newComment);

    const commentWithUser = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    await this.notificationsService.createNotification({
      recipient: proof.journey.user,
      sender: user,
      type: NotificationType.NEW_COMMENT,
      journeyId: proof.journey.id,
      proofId: proof.id,
    });

    this.eventsGateway.server.emit(`proof:${proofId}:new_comment`, commentWithUser);
    return commentWithUser;
  }

  async deleteComment(commentId: string, user: User): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'proof'],
    });

    if (!comment) {
      throw new NotFoundException(`Comentário com ID "${commentId}" não encontrado.`);
    }

    if (comment.user.id !== user.id) {
      throw new ForbiddenException('Você não tem permissão para deletar este comentário.');
    }

    await this.commentsRepository.remove(comment);

    this.eventsGateway.server.emit(`proof:${comment.proof.id}:comment_deleted`, { commentId });
  }
}