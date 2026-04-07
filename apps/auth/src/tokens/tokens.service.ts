import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokensService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokensService.name);
  private redis: Redis;
  private redisAvailable = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis not available — token features disabled');
          return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
      },
    });

    this.redis.connect()
      .then(() => {
        this.redisAvailable = true;
        this.logger.log('Redis connected successfully');
      })
      .catch(() => {
        this.redisAvailable = false;
        this.logger.warn('Redis not available — token features will be disabled');
      });
  }

  onModuleDestroy() {
    if (this.redisAvailable) {
      this.redis.disconnect();
    }
  }

  private ensureRedis(): void {
    if (!this.redisAvailable) {
      this.logger.warn('Redis operation skipped — Redis not connected');
    }
  }

  // Access token blacklist
  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.redisAvailable) { this.ensureRedis(); return; }
    await this.redis.setex(`blacklist:access:${jti}`, ttlSeconds, '1');
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.redisAvailable) { this.ensureRedis(); return false; }
    const result = await this.redis.get(`blacklist:access:${jti}`);
    return result === '1';
  }

  // Refresh token store
  async saveRefreshToken(userId: string, tokenId: string, token: string): Promise<void> {
    if (!this.redisAvailable) { this.ensureRedis(); return; }
    const hashedToken = await bcrypt.hash(token, 12);
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redis.setex(`refresh:${userId}:${tokenId}`, ttl, hashedToken);
  }

  async getRefreshToken(userId: string, tokenId: string): Promise<string | null> {
    if (!this.redisAvailable) { this.ensureRedis(); return null; }
    return this.redis.get(`refresh:${userId}:${tokenId}`);
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    if (!this.redisAvailable) { this.ensureRedis(); return; }
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    if (!this.redisAvailable) { this.ensureRedis(); return; }
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // 2FA backup codes
  async saveBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
    if (!this.redisAvailable) { this.ensureRedis(); return; }
    const ttl = 30 * 24 * 60 * 60; // 30 days
    await this.redis.setex(`2fa:backup:${userId}`, ttl, JSON.stringify(hashedCodes));
  }

  async verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
    if (!this.redisAvailable) { this.ensureRedis(); return false; }
    const stored = await this.redis.get(`2fa:backup:${userId}`);
    if (!stored) return false;

    const hashedCodes: string[] = JSON.parse(stored);
    let codeIndex = -1;
    for (let i = 0; i < hashedCodes.length; i++) {
      if (await bcrypt.compare(code, hashedCodes[i])) {
        codeIndex = i;
        break;
      }
    }

    if (codeIndex === -1) return false;

    // Remove the used code
    hashedCodes.splice(codeIndex, 1);
    await this.redis.setex(`2fa:backup:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(hashedCodes));

    return true;
  }
}