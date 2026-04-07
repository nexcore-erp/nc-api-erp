import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class TokensService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private redis;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void>;
    isAccessTokenBlacklisted(jti: string): Promise<boolean>;
    saveRefreshToken(userId: string, tokenId: string, token: string): Promise<void>;
    getRefreshToken(userId: string, tokenId: string): Promise<string | null>;
    deleteRefreshToken(userId: string, tokenId: string): Promise<void>;
    deleteAllUserRefreshTokens(userId: string): Promise<void>;
    saveBackupCodes(userId: string, hashedCodes: string[]): Promise<void>;
    verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean>;
}
