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
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const bcrypt = require("bcrypt");
let TokensService = class TokensService {
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
            password: this.configService.get('REDIS_PASSWORD'),
        });
    }
    onModuleDestroy() {
        this.redis.disconnect();
    }
    async blacklistAccessToken(jti, ttlSeconds) {
        await this.redis.setex(`blacklist:access:${jti}`, ttlSeconds, '1');
    }
    async isAccessTokenBlacklisted(jti) {
        const result = await this.redis.get(`blacklist:access:${jti}`);
        return result === '1';
    }
    async saveRefreshToken(userId, tokenId, token) {
        const hashedToken = await bcrypt.hash(token, 12);
        const ttl = 7 * 24 * 60 * 60;
        await this.redis.setex(`refresh:${userId}:${tokenId}`, ttl, hashedToken);
    }
    async getRefreshToken(userId, tokenId) {
        return this.redis.get(`refresh:${userId}:${tokenId}`);
    }
    async deleteRefreshToken(userId, tokenId) {
        await this.redis.del(`refresh:${userId}:${tokenId}`);
    }
    async deleteAllUserRefreshTokens(userId) {
        const keys = await this.redis.keys(`refresh:${userId}:*`);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    async saveBackupCodes(userId, hashedCodes) {
        const ttl = 30 * 24 * 60 * 60;
        await this.redis.setex(`2fa:backup:${userId}`, ttl, JSON.stringify(hashedCodes));
    }
    async verifyAndConsumeBackupCode(userId, code) {
        const stored = await this.redis.get(`2fa:backup:${userId}`);
        if (!stored)
            return false;
        const hashedCodes = JSON.parse(stored);
        let codeIndex = -1;
        for (let i = 0; i < hashedCodes.length; i++) {
            if (await bcrypt.compare(code, hashedCodes[i])) {
                codeIndex = i;
                break;
            }
        }
        if (codeIndex === -1)
            return false;
        hashedCodes.splice(codeIndex, 1);
        await this.redis.setex(`2fa:backup:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(hashedCodes));
        return true;
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map