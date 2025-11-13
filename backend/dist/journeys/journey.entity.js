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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Journey = exports.JourneyStatus = void 0;
const proof_entity_1 = require("../proofs/proof.entity");
const user_entity_1 = require("../users/user.entity");
const typeorm_1 = require("typeorm");
var JourneyStatus;
(function (JourneyStatus) {
    JourneyStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JourneyStatus["COMPLETED"] = "COMPLETED";
    JourneyStatus["ABANDONED"] = "ABANDONED";
})(JourneyStatus = exports.JourneyStatus || (exports.JourneyStatus = {}));
let Journey = class Journey {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Journey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Journey.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Journey.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: JourneyStatus,
        default: JourneyStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], Journey.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Array)
], Journey.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.journeys, { eager: true }),
    __metadata("design:type", user_entity_1.User)
], Journey.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => proof_entity_1.Proof, (proof) => proof.journey, { cascade: true }),
    __metadata("design:type", Array)
], Journey.prototype, "proofs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Journey.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Journey.prototype, "updatedAt", void 0);
Journey = __decorate([
    (0, typeorm_1.Entity)('journeys')
], Journey);
exports.Journey = Journey;
//# sourceMappingURL=journey.entity.js.map