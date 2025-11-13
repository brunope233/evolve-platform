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
exports.Support = void 0;
const proof_entity_1 = require("../proofs/proof.entity");
const user_entity_1 = require("../users/user.entity");
const typeorm_1 = require("typeorm");
let Support = class Support {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Support.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.supports, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Support.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proof_entity_1.Proof, (proof) => proof.supports, { onDelete: 'CASCADE' }),
    __metadata("design:type", proof_entity_1.Proof)
], Support.prototype, "proof", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Support.prototype, "createdAt", void 0);
Support = __decorate([
    (0, typeorm_1.Entity)('supports')
], Support);
exports.Support = Support;
//# sourceMappingURL=support.entity.js.map