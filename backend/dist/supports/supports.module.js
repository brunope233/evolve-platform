"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const support_entity_1 = require("./support.entity");
const supports_service_1 = require("./supports.service");
const supports_controller_1 = require("./supports.controller");
const proof_entity_1 = require("../proofs/proof.entity");
const events_module_1 = require("../websockets/events.module");
const notifications_module_1 = require("../notifications/notifications.module");
let SupportsModule = class SupportsModule {
};
SupportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([support_entity_1.Support, proof_entity_1.Proof]),
            events_module_1.EventsModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [supports_service_1.SupportsService],
        controllers: [supports_controller_1.SupportsController],
    })
], SupportsModule);
exports.SupportsModule = SupportsModule;
//# sourceMappingURL=supports.module.js.map