"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const proof_entity_1 = require("./proof.entity");
const journeys_service_1 = require("../journeys/journeys.service");
const events_gateway_1 = require("../websockets/events.gateway");
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let ProofsService = class ProofsService {
    constructor(proofsRepository, journeysService, eventsGateway, httpService, notificationsService) {
        this.proofsRepository = proofsRepository;
        this.journeysService = journeysService;
        this.eventsGateway = eventsGateway;
        this.httpService = httpService;
        this.notificationsService = notificationsService;
    }
    async create(createProofDto, user, videoFileName) {
        const { journeyId, title, description, requestRealTimeSeal, parentProofId } = createProofDto;
        const journey = await this.journeysService.findOneById(journeyId);
        if (!journey) {
            throw new common_1.NotFoundException(`Jornada com ID "${journeyId}" não encontrada.`);
        }
        const proofData = {
            title, description, journey, user,
            hasRealTimeSeal: !!requestRealTimeSeal,
            originalVideoUrl: `uploads/${videoFileName}`,
            status: proof_entity_1.ProofStatus.PROCESSING,
        };
        if (parentProofId) {
            const parentProof = await this.proofsRepository.findOne({ where: { id: parentProofId }, relations: ['journey', 'journey.user'] });
            if (!parentProof) {
                throw new common_1.NotFoundException('Prova original não encontrada.');
            }
            if (parentProof.journey.user.id === user.id) {
                throw new common_1.ForbiddenException('Você não pode responder à sua própria prova.');
            }
            proofData.parentProof = parentProof;
        }
        const newProof = this.proofsRepository.create(proofData);
        const savedProof = await this.proofsRepository.save(newProof);
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post('http://video-processor:3002/process', { proofId: savedProof.id, videoFileName: videoFileName }));
        }
        catch (error) {
            console.error("Falha ao disparar job:", error.message);
        }
        const fullProofForSocket = await this.proofsRepository.findOne({ where: { id: savedProof.id }, relations: ['parentProof', 'user'] });
        this.eventsGateway.server.emit(`journey:${journeyId}:proof_added`, fullProofForSocket);
        return savedProof;
    }
    async updateProofStatus(proofId, status, thumbnailUrl) {
        const proof = await this.proofsRepository.findOne({ where: { id: proofId }, relations: ['journey', 'user', 'comments', 'supports', 'assists', 'parentProof'] });
        if (!proof) {
            throw new common_1.NotFoundException(`Proof com ID "${proofId}" não encontrada.`);
        }
        proof.status = status;
        if (thumbnailUrl) {
            proof.thumbnailUrl = thumbnailUrl;
        }
        const updatedProof = await this.proofsRepository.save(proof);
        this.eventsGateway.server.emit(`proof:${proofId}:updated`, updatedProof);
    }
    async remove(proofId, user) {
        const proof = await this.proofsRepository.findOne({ where: { id: proofId }, relations: ['journey', 'user'] });
        if (!proof) {
            throw new common_1.NotFoundException(`Prova com ID "${proofId}" não encontrada.`);
        }
        if (proof.user.id !== user.id) {
            throw new common_1.ForbiddenException('Você não tem permissão para deletar esta prova.');
        }
        if (proof.originalVideoUrl) {
            const filePath = (0, path_1.join)(process.cwd(), proof.originalVideoUrl);
            try {
                await fs.unlink(filePath);
            }
            catch (error) {
                console.error(`Erro ao deletar vídeo:`, error);
            }
        }
        if (proof.thumbnailUrl) {
            const thumbPath = (0, path_1.join)(process.cwd(), proof.thumbnailUrl);
            try {
                await fs.unlink(thumbPath);
            }
            catch (error) {
                console.error(`Erro ao deletar thumbnail:`, error);
            }
        }
        await this.proofsRepository.delete(proofId);
        this.eventsGateway.server.emit(`journey:${proof.journey.id}:proof_removed`, { proofId });
    }
    async markAsBestAssist(parentProofId, assistId, user) {
        const parentProof = await this.proofsRepository.findOne({
            where: { id: parentProofId },
            relations: ['journey', 'journey.user', 'assists', 'comments', 'supports'],
        });
        if (!parentProof) {
            throw new common_1.NotFoundException('O pedido de ajuda original não foi encontrado.');
        }
        if (parentProof.journey.user.id !== user.id) {
            throw new common_1.ForbiddenException('Apenas o autor pode marcar a melhor resposta.');
        }
        const assistProof = await this.proofsRepository.findOne({ where: { id: assistId }, relations: ['user'] });
        if (!assistProof || !assistProof.user) {
            throw new common_1.NotFoundException('A prova de resposta não foi encontrada.');
        }
        const isLegitAssist = parentProof.assists.some(assist => assist.id === assistId);
        if (!isLegitAssist) {
            throw new common_1.BadRequestException('Esta não é uma resposta válida.');
        }
        parentProof.bestAssistId = assistId;
        const updatedParentProof = await this.proofsRepository.save(parentProof);
        await this.notificationsService.createNotification({
            recipient: assistProof.user,
            sender: user,
            type: notification_entity_1.NotificationType.BEST_ASSIST,
            journeyId: parentProof.journey.id,
            proofId: parentProof.id,
        });
        this.eventsGateway.server.emit(`proof:${parentProofId}:updated`, updatedParentProof);
        return updatedParentProof;
    }
};
ProofsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(proof_entity_1.Proof)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        journeys_service_1.JourneysService,
        events_gateway_1.EventsGateway,
        axios_1.HttpService,
        notifications_service_1.NotificationsService])
], ProofsService);
exports.ProofsService = ProofsService;
//# sourceMappingURL=proofs.service.js.map