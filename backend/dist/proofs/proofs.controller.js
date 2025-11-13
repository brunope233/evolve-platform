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
exports.ProofsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const proofs_service_1 = require("./proofs.service");
const create_proof_dto_1 = require("./dto/create-proof.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
let ProofsController = class ProofsController {
    constructor(proofsService) {
        this.proofsService = proofsService;
    }
    uploadFile(file, body, req) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo recebido pelo controller!');
        }
        return this.proofsService.create(body, req.user, file.filename);
    }
    remove(id, req) {
        return this.proofsService.remove(id, req.user);
    }
    markAsBestAssist(parentProofId, assistId, req) {
        return this.proofsService.markAsBestAssist(parentProofId, assistId, req.user);
    }
    updateProofStatus(id, body) {
        return this.proofsService.updateProofStatus(id, body.status, body.thumbnailUrl);
    }
};
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.startsWith('video/')) {
                return callback(new common_1.BadRequestException('Apenas arquivos de vídeo são permitidos!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 1024 * 1024 * 100
        }
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_proof_dto_1.CreateProofDto, Object]),
    __metadata("design:returntype", void 0)
], ProofsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProofsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(':parentProofId/mark-best/:assistId'),
    __param(0, (0, common_1.Param)('parentProofId')),
    __param(1, (0, common_1.Param)('assistId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProofsController.prototype, "markAsBestAssist", null);
__decorate([
    (0, common_1.Patch)(':id/processed'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProofsController.prototype, "updateProofStatus", null);
ProofsController = __decorate([
    (0, common_1.Controller)('proofs'),
    __metadata("design:paramtypes", [proofs_service_1.ProofsService])
], ProofsController);
exports.ProofsController = ProofsController;
//# sourceMappingURL=proofs.controller.js.map