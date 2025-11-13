"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const proof_entity_1 = require("../proofs/proof.entity");
const events_gateway_1 = require("../websockets/events.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let CommentsService = class CommentsService {
    constructor(commentsRepository, proofsRepository, eventsGateway, notificationsService) {
        this.commentsRepository = commentsRepository;
        this.proofsRepository = proofsRepository;
        this.eventsGateway = eventsGateway;
        this.notificationsService = notificationsService;
    }
    async getCommentsForProof(proofId) {
        return this.commentsRepository.find({
            where: { proof: { id: proofId } },
            order: { createdAt: 'ASC' },
            relations: ['user'],
        });
    }
    async createComment(proofId, createCommentDto, user) {
        const proof = await this.proofsRepository.findOne({
            where: { id: proofId },
            relations: ['journey', 'journey.user'],
        });
        if (!proof) {
            throw new common_1.NotFoundException(`Prova com ID "${proofId}" não encontrada.`);
        }
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
            type: notification_entity_1.NotificationType.NEW_COMMENT,
            journeyId: proof.journey.id,
            proofId: proof.id,
        });
        this.eventsGateway.server.emit(`proof:${proofId}:new_comment`, commentWithUser);
        return commentWithUser;
    }
    async deleteComment(commentId, user) {
        const comment = await this.commentsRepository.findOne({
            where: { id: commentId },
            relations: ['user', 'proof'],
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comentário com ID "${commentId}" não encontrado.`);
        }
        if (comment.user.id !== user.id) {
            throw new common_1.ForbiddenException('Você não tem permissão para deletar este comentário.');
        }
        await this.commentsRepository.remove(comment);
        this.eventsGateway.server.emit(`proof:${comment.proof.id}:comment_deleted`, { commentId });
    }
};
CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(1, (0, typeorm_1.InjectRepository)(proof_entity_1.Proof)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        events_gateway_1.EventsGateway,
        notifications_service_1.NotificationsService])
], CommentsService);
exports.CommentsService = CommentsService;
//# sourceMappingURL=comments.service.js.map