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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const journey_entity_1 = require("../journeys/journey.entity");
const typeorm_2 = require("typeorm");
let SearchService = class SearchService {
    constructor(journeysRepository) {
        this.journeysRepository = journeysRepository;
    }
    async searchJourneys(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const searchTerm = `%${query.trim()}%`;
        const queryBuilder = this.journeysRepository.createQueryBuilder('journey');
        queryBuilder
            .leftJoinAndSelect('journey.user', 'user')
            .where(new typeorm_2.Brackets(qb => {
            qb.where('journey.title ILIKE :searchTerm', { searchTerm })
                .orWhere('journey.description ILIKE :searchTerm', { searchTerm })
                .orWhere('array_to_string(journey.tags, \' \') ILIKE :searchTerm', { searchTerm });
        }))
            .orderBy('journey.createdAt', 'DESC');
        return queryBuilder.getMany();
    }
};
SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(journey_entity_1.Journey)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SearchService);
exports.SearchService = SearchService;
//# sourceMappingURL=search.service.js.map