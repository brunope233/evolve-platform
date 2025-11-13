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
var Proof_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proof = exports.ProofStatus = void 0;
const journey_entity_1 = require("../journeys/journey.entity");
const typeorm_1 = require("typeorm");
const comment_entity_1 = require("../comments/comment.entity");
const support_entity_1 = require("../supports/support.entity");
const user_entity_1 = require("../users/user.entity");
var ProofStatus;
(function (ProofStatus) {
    ProofStatus["PROCESSING"] = "PROCESSING";
    ProofStatus["READY"] = "READY";
    ProofStatus["FAILED"] = "FAILED";
})(ProofStatus = exports.ProofStatus || (exports.ProofStatus = {}));
let Proof = Proof_1 = class Proof {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Proof.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "originalVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "processedVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProofStatus, default: ProofStatus.PROCESSING }),
    __metadata("design:type", String)
], Proof.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Proof.prototype, "hasRealTimeSeal", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proof_1, proof => proof.assists, { nullable: true, onDelete: 'SET NULL' }),
    __metadata("design:type", Proof)
], Proof.prototype, "parentProof", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Proof_1, proof => proof.parentProof, { cascade: true }),
    __metadata("design:type", Array)
], Proof.prototype, "assists", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Proof.prototype, "bestAssistId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => journey_entity_1.Journey, (journey) => journey.proofs, { onDelete: 'CASCADE' }),
    __metadata("design:type", journey_entity_1.Journey)
], Proof.prototype, "journey", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    __metadata("design:type", user_entity_1.User)
], Proof.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (comment) => comment.proof, { cascade: true }),
    __metadata("design:type", Array)
], Proof.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => support_entity_1.Support, (support) => support.proof, { cascade: true }),
    __metadata("design:type", Array)
], Proof.prototype, "supports", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Proof.prototype, "createdAt", void 0);
Proof = Proof_1 = __decorate([
    (0, typeorm_1.Entity)('proofs')
], Proof);
exports.Proof = Proof;
//# sourceMappingURL=proof.entity.js.map