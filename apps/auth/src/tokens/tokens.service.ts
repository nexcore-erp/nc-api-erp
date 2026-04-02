import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokensService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  // Access token blacklist
  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.setex(`blacklist:access:${jti}`, ttlSeconds, '1');
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:access:${jti}`);
    return result === '1';
  }

  // Refresh token store
  async saveRefreshToken(userId: string, tokenId: string, token: string): Promise<void> {
    const hashedToken = await bcrypt.hash(token, 12);
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redis.setex(`refresh:${userId}:${tokenId}`, ttl, hashedToken);
  }

  async getRefreshToken(userId: string, tokenId: string): Promise<string | null> {
    return this.redis.get(`refresh:${userId}:${tokenId}`);
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // 2FA backup codes
  async saveBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
    const ttl = 30 * 24 * 60 * 60; // 30 days
    await this.redis.setex(`2fa:backup:${userId}`, ttl, JSON.stringify(hashedCodes));
  }

  async verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`2fa:backup:${userId}`);
    if (!stored) return false;

    const hashedCodes: string[] = JSON.parse(stored);
    const codeIndex = hashedCodes.findIndex(async (hashed) => await bcrypt.compare(code, hashed));

    if (codeIndex === -1) return false;

    // Remove the used code
    hashedCodes.splice(codeIndex, 1);
    await this.redis.setex(`2fa:backup:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(hashedCodes));

    return true;
  }
}