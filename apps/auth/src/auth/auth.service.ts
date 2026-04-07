import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { MailService } from '../mail/mail.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';

import { AuthResponseDto, TokensDto, TwoFactorSetupDto, BackupCodesDto } from './dto/responses.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokensService: TokensService,
    private mailService: MailService,
    private twoFactorService: TwoFactorService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject('AUTH_SERVICE') private rabbitMqClient: ClientProxy,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, twoFactorCode } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked due to too many failed attempts');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        throw new UnauthorizedException('2FA code required');
      }
      const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret!);
      const isValid2FA = this.twoFactorService.verifyCode(decryptedSecret, twoFactorCode);
      if (!isValid2FA) {
        await this.handleFailedLogin(user);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Reset failed attempts and update last login
    await this.usersService.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.roles);

    // Publish login event
    this.rabbitMqClient.emit('user.logged_in', {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokensDto> {
    // Token validation is done in strategy, here we rotate
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.roles);

    return tokens;
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(accessToken) as any;
      if (payload && payload.jti) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        await this.tokensService.blacklistAccessToken(payload.jti, ttl);
      }
    } catch (error) {
      // Continue with logout even if token decoding fails
    }

    // Delete all refresh tokens for user
    await this.tokensService.deleteAllUserRefreshTokens(userId);

    // Publish logout event
    this.rabbitMqClient.emit('user.logged_out', {
      userId,
      timestamp: new Date(),
    });
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.usersService.createUser(registerDto);

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.firstName);

    // Publish registration event
    this.rabbitMqClient.emit('user.registered', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    });

    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    // Don't reveal if user exists

    if (user) {
      const resetToken = this.generateResetToken();
      const hashedToken = await bcrypt.hash(resetToken, 12);

      await this.usersService.updateUser(user.id, {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user with valid reset token
    const user = await this.findUserByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password and clear reset token
    await this.usersService.updateUser(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    // Invalidate all refresh tokens
    await this.tokensService.deleteAllUserRefreshTokens(user.id);

    // Publish password change event
    this.rabbitMqClient.emit('user.password_changed', {
      userId: user.id,
      timestamp: new Date(),
    });
  }

  async enable2fa(userId: string): Promise<TwoFactorSetupDto> {
    const secret = this.twoFactorService.generateSecret();
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const encryptedSecret = this.twoFactorService.encryptSecret(secret);
    await this.usersService.updateUser(userId, {
      twoFactorSecret: encryptedSecret,
    });

    const keyUri = this.twoFactorService.generateKeyUri(user.email, secret);
    const qrCode = await this.twoFactorService.generateQRCode(keyUri);

    return { qrCode, secret };
  }

  async confirm2fa(userId: string, code: string): Promise<BackupCodesDto> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
    const isValid = this.twoFactorService.verifyCode(decryptedSecret, code);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Generate backup codes
    const backupCodes = this.twoFactorService.generateBackupCodes();
    const hashedCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 12))
    );

    await this.tokensService.saveBackupCodes(userId, hashedCodes);

    // Enable 2FA
    await this.usersService.updateUser(userId, {
      isTwoFactorEnabled: true,
    });

    // Publish 2FA enabled event
    this.rabbitMqClient.emit('user.2fa_enabled', {
      userId,
      timestamp: new Date(),
    });

    return { backupCodes };
  }

  async disable2fa(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
    const isValidCode = this.twoFactorService.verifyCode(decryptedSecret, code);
    const isValidBackup = await this.tokensService.verifyAndConsumeBackupCode(userId, code);

    if (!isValidCode && !isValidBackup) {
      throw new BadRequestException('Invalid 2FA code or backup code');
    }

    await this.usersService.updateUser(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  private async generateTokens(userId: string, email: string, roles: any[]): Promise<TokensDto> {
    const jti = uuidv4();
    const tokenId = uuidv4();

    const payload = {
      sub: userId,
      email,
      roles: roles?.map(r => r.name) || [],
      jti,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }
    );

    // Store refresh token
    await this.tokensService.saveRefreshToken(userId, tokenId, refreshToken);

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(user: any): Promise<void> {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates: any = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      this.rabbitMqClient.emit('user.account_locked', {
        userId: user.id,
        lockedUntil: updates.lockedUntil,
      });
    }

    await this.usersService.updateUser(user.id, updates);
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async findUserByResetToken(token: string): Promise<any> {
    // This is a simplified implementation
    // In production, you'd want a more efficient query
    const users = await this.usersService.findAll(); // Need to add this method
    for (const user of users) {
      if (user.passwordResetToken && user.passwordResetExpires > new Date()) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) return user;
      }
    }
    return null;
  }

  private sanitizeUser(user: any): any {
    const { password, passwordResetToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
