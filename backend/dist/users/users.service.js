"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let UsersService = class UsersService {
    constructor(usersRepository, notificationsService) {
        this.usersRepository = usersRepository;
        this.notificationsService = notificationsService;
    }
    async create(createUserDto) {
        const newUser = this.usersRepository.create(createUserDto);
        return this.usersRepository.save(newUser);
    }
    async findByEmailOrUsername(email, username) {
        return this.usersRepository.findOne({ where: [{ email: (0, typeorm_2.ILike)(email) }, { username: (0, typeorm_2.ILike)(username) }] });
    }
    async findOneByEmailForAuth(email) {
        return this.usersRepository.createQueryBuilder('user').where('user.email = :email', { email }).addSelect('user.password').getOne();
    }
    async findOneById(id) {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['following'] });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async findOneByUsername(username, currentUserId) {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.journeys', 'journeys')
            .leftJoinAndSelect('journeys.user', 'journeyUser')
            .loadRelationCountAndMap('user.followerCount', 'user.followers')
            .loadRelationCountAndMap('user.followingCount', 'user.following')
            .where('LOWER(user.username) = LOWER(:username)', { username })
            .orderBy('journeys.createdAt', 'DESC')
            .getOne();
        if (!user) {
            throw new common_1.NotFoundException(`User with username "${username}" not found`);
        }
        let isFollowing = false;
        if (currentUserId && currentUserId !== user.id) {
            const currentUser = await this.usersRepository.findOne({
                where: { id: currentUserId },
                relations: ['following']
            });
            if (currentUser) {
                isFollowing = currentUser.following.some(followedUser => followedUser.id === user.id);
            }
        }
        const { password } = user, result = __rest(user, ["password"]);
        return Object.assign(Object.assign({}, result), { isFollowing });
    }
    async update(id, updateUserDto) {
        const user = await this.usersRepository.preload(Object.assign({ id: id }, updateUserDto));
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return this.usersRepository.save(user);
    }
    async updateAvatar(userId, avatarPath) {
        const user = await this.findOneById(userId);
        const oldAvatarPath = user.avatarUrl;
        user.avatarUrl = avatarPath.replace(/\\/g, '/');
        const updatedUser = await this.usersRepository.save(user);
        if (oldAvatarPath) {
            const fullOldPath = (0, path_1.join)(process.cwd(), oldAvatarPath);
            try {
                await fs.unlink(fullOldPath);
                console.log(`Avatar antigo deletado: ${fullOldPath}`);
            }
            catch (error) {
                console.error(`Erro ao deletar avatar antigo ${fullOldPath}:`, error.message);
            }
        }
        delete updatedUser.password;
        return updatedUser;
    }
    async toggleFollow(followerId, followingUsername) {
        if (!followerId || !followingUsername) {
            throw new common_1.ForbiddenException('Ação inválida.');
        }
        const follower = await this.findOneById(followerId);
        const userToFollow = await this.usersRepository.findOne({ where: { username: (0, typeorm_2.ILike)(followingUsername) } });
        if (!userToFollow || follower.id === userToFollow.id) {
            throw new common_1.NotFoundException(`Usuário "${followingUsername}" não encontrado ou ação inválida.`);
        }
        const isFollowing = follower.following.some(user => user.id === userToFollow.id);
        if (isFollowing) {
            follower.following = follower.following.filter(user => user.id !== userToFollow.id);
            await this.usersRepository.save(follower);
            return { following: false };
        }
        else {
            follower.following.push(userToFollow);
            await this.usersRepository.save(follower);
            await this.notificationsService.createNotification({
                recipient: userToFollow,
                sender: follower,
                type: notification_entity_1.NotificationType.NEW_FOLLOWER,
            });
            return { following: true };
        }
    }
};
UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map