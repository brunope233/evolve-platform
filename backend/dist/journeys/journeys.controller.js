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
exports.JourneysController = void 0;
const common_1 = require("@nestjs/common");
const journeys_service_1 = require("./journeys.service");
const create_journey_dto_1 = require("./dto/create-journey.dto");
const update_journey_dto_1 = require("./dto/update-journey.dto");
const passport_1 = require("@nestjs/passport");
let JourneysController = class JourneysController {
    constructor(journeysService) {
        this.journeysService = journeysService;
    }
    async create(body, req) {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!! ROTA POST /journeys FOI ALCANÇADA !!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('Corpo recebido:', body);
        if (Object.keys(body).length === 0) {
            console.error("ERRO: O corpo da requisição chegou vazio!");
            throw new common_1.BadRequestException("O corpo da requisição está vazio ou em formato inválido.");
        }
        const createJourneyDto = new create_journey_dto_1.CreateJourneyDto();
        createJourneyDto.title = body.title;
        createJourneyDto.description = body.description;
        createJourneyDto.tags = body.tags || [];
        const validationPipe = new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
        try {
            const validatedDto = await validationPipe.transform(createJourneyDto, { type: 'body', metatype: create_journey_dto_1.CreateJourneyDto });
            return this.journeysService.create(validatedDto, req.user);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    findAll(page = 1, limit = 10) {
        limit = limit > 100 ? 100 : limit;
        return this.journeysService.findAll({ page, limit });
    }
    findOne(id) {
        return this.journeysService.findOneById(id);
    }
    update(id, updateJourneyDto, req) {
        return this.journeysService.update(id, updateJourneyDto, req.user);
    }
    remove(id, req) {
        return this.journeysService.remove(id, req.user);
    }
};
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], JourneysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JourneysController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_journey_dto_1.UpdateJourneyDto, Object]),
    __metadata("design:returntype", void 0)
], JourneysController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JourneysController.prototype, "remove", null);
JourneysController = __decorate([
    (0, common_1.Controller)('journeys'),
    __metadata("design:paramtypes", [journeys_service_1.JourneysService])
], JourneysController);
exports.JourneysController = JourneysController;
//# sourceMappingURL=journeys.controller.js.map