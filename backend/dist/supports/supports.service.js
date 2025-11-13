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
exports.SupportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const support_entity_1 = require("./support.entity");
const proof_entity_1 = require("../proofs/proof.entity");
const events_gateway_1 = require("../websockets/events.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let SupportsService = class SupportsService {
    constructor(supportsRepository, proofsRepository, eventsGateway, notificationsService) {
        this.supportsRepository = supportsRepository;
        this.proofsRepository = proofsRepository;
        this.eventsGateway = eventsGateway;
        this.notificationsService = notificationsService;
    }
    async toggleSupport(proofId, user) {
        const proof = await this.proofsRepository.findOne({
            where: { id: proofId },
            relations: ['journey', 'journey.user'],
        });
        if (!proof) {
            throw new common_1.NotFoundException(`Prova com ID "${proofId}" não encontrada.`);
        }
        const existingSupport = await this.supportsRepository.findOne({
            where: {
                proof: { id: proofId },
                user: { id: user.id },
            },
        });
        let supported = false;
        if (existingSupport) {
            await this.supportsRepository.remove(existingSupport);
            supported = false;
        }
        else {
            const newSupport = this.supportsRepository.create({ user, proof });
            await this.supportsRepository.save(newSupport);
            supported = true;
            await this.notificationsService.createNotification({
                recipient: proof.journey.user,
                sender: user,
                type: notification_entity_1.NotificationType.NEW_SUPPORT,
                journeyId: proof.journey.id,
                proofId: proof.id,
            });
        }
        const newSupportCount = await this.supportsRepository.count({ where: { proof: { id: proofId } } });
        this.eventsGateway.server.emit(`proof:${proofId}:support_updated`, { newSupportCount });
        return { supported };
    }
};
SupportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(support_entity_1.Support)),
    __param(1, (0, typeorm_1.InjectRepository)(proof_entity_1.Proof)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        events_gateway_1.EventsGateway,
        notifications_service_1.NotificationsService])
], SupportsService);
exports.SupportsService = SupportsService;
//# sourceMappingURL=supports.service.js.map