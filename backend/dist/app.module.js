"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const journeys_module_1 = require("./journeys/journeys.module");
const proofs_module_1 = require("./proofs/proofs.module");
const events_module_1 = require("./websockets/events.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const comments_module_1 = require("./comments/comments.module");
const terminus_1 = require("@nestjs/terminus");
const axios_1 = require("@nestjs/axios");
const supports_module_1 = require("./supports/supports.module");
const search_module_1 = require("./search/search.module");
const notifications_module_1 = require("./notifications/notifications.module");
const feed_module_1 = require("./feed/feed.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            terminus_1.TerminusModule,
            axios_1.HttpModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: {
                    index: false,
                }
            }),
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useClass: database_config_1.DatabaseConfig,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            journeys_module_1.JourneysModule,
            proofs_module_1.ProofsModule,
            events_module_1.EventsModule,
            comments_module_1.CommentsModule,
            supports_module_1.SupportsModule,
            search_module_1.SearchModule,
            notifications_module_1.NotificationsModule,
            feed_module_1.FeedModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map