"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const proof_entity_1 = require("./proof.entity");
const proofs_service_1 = require("./proofs.service");
const proofs_controller_1 = require("./proofs.controller");
const journeys_module_1 = require("../journeys/journeys.module");
const events_module_1 = require("../websockets/events.module");
const journeys_service_1 = require("../journeys/journeys.service");
const journey_entity_1 = require("../journeys/journey.entity");
const axios_1 = require("@nestjs/axios");
const user_entity_1 = require("../users/user.entity");
const comment_entity_1 = require("../comments/comment.entity");
const support_entity_1 = require("../supports/support.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let ProofsModule = class ProofsModule {
};
ProofsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([proof_entity_1.Proof, journey_entity_1.Journey, user_entity_1.User, comment_entity_1.Comment, support_entity_1.Support]),
            journeys_module_1.JourneysModule,
            events_module_1.EventsModule,
            axios_1.HttpModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [proofs_controller_1.ProofsController],
        providers: [proofs_service_1.ProofsService, journeys_service_1.JourneysService],
    })
], ProofsModule);
exports.ProofsModule = ProofsModule;
//# sourceMappingURL=proofs.module.js.map