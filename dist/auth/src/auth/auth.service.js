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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const common_2 = require("@nestjs/common");
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const users_service_1 = require("../users/users.service");
const tokens_service_1 = require("../tokens/tokens.service");
const mail_service_1 = require("../mail/mail.service");
const two_factor_service_1 = require("../two-factor/two-factor.service");
let AuthService = class AuthService {
    constructor(usersService, tokensService, mailService, twoFactorService, jwtService, configService, rabbitMqClient) {
        this.usersService = usersService;
        this.tokensService = tokensService;
        this.mailService = mailService;
        this.twoFactorService = twoFactorService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.rabbitMqClient = rabbitMqClient;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            return null;
        const isPasswordValid = await this.usersService.validatePassword(password, user.password);
        if (!isPasswordValid)
            return null;
        return user;
    }
    async login(loginDto) {
        const { email, password, twoFactorCode } = loginDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is locked due to too many failed attempts');
        }
        const isPasswordValid = await this.usersService.validatePassword(password, user.password);
        if (!isPasswordValid) {
            await this.handleFailedLogin(user);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isTwoFactorEnabled) {
            if (!twoFactorCode) {
                throw new common_1.UnauthorizedException('2FA code required');
            }
            const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
            const isValid2FA = this.twoFactorService.verifyCode(decryptedSecret, twoFactorCode);
            if (!isValid2FA) {
                await this.handleFailedLogin(user);
                throw new common_1.UnauthorizedException('Invalid 2FA code');
            }
        }
        await this.usersService.updateUser(user.id, {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
        });
        const tokens = await this.generateTokens(user.id, user.email, user.roles);
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
    async refreshTokens(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.roles);
        return tokens;
    }
    async logout(userId, accessToken) {
        try {
            const payload = this.jwtService.decode(accessToken);
            if (payload && payload.jti) {
                const ttl = payload.exp - Math.floor(Date.now() / 1000);
                await this.tokensService.blacklistAccessToken(payload.jti, ttl);
            }
        }
        catch (error) {
        }
        await this.tokensService.deleteAllUserRefreshTokens(userId);
        this.rabbitMqClient.emit('user.logged_out', {
            userId,
            timestamp: new Date(),
        });
    }
    async register(registerDto) {
        const user = await this.usersService.createUser(registerDto);
        await this.mailService.sendWelcomeEmail(user.email, user.firstName);
        this.rabbitMqClient.emit('user.registered', {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
        });
        return this.sanitizeUser(user);
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (user) {
            const resetToken = this.generateResetToken();
            const hashedToken = await bcrypt.hash(resetToken, 12);
            await this.usersService.updateUser(user.id, {
                passwordResetToken: hashedToken,
                passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
            });
            await this.mailService.sendPasswordResetEmail(user.email, resetToken);
        }
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
    async resetPassword(resetPasswordDto) {
        const { token, newPassword, confirmPassword } = resetPasswordDto;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const user = await this.findUserByResetToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        await this.usersService.updateUser(user.id, {
            password: newPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        });
        await this.tokensService.deleteAllUserRefreshTokens(user.id);
        this.rabbitMqClient.emit('user.password_changed', {
            userId: user.id,
            timestamp: new Date(),
        });
    }
    async enable2fa(userId) {
        const secret = this.twoFactorService.generateSecret();
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const encryptedSecret = this.twoFactorService.encryptSecret(secret);
        await this.usersService.updateUser(userId, {
            twoFactorSecret: encryptedSecret,
        });
        const keyUri = this.twoFactorService.generateKeyUri(user.email, secret);
        const qrCode = await this.twoFactorService.generateQRCode(keyUri);
        return { qrCode, secret };
    }
    async confirm2fa(userId, code) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.twoFactorSecret) {
            throw new common_1.BadRequestException('2FA setup not initiated');
        }
        const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
        const isValid = this.twoFactorService.verifyCode(decryptedSecret, code);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid 2FA code');
        }
        const backupCodes = this.twoFactorService.generateBackupCodes();
        const hashedCodes = await Promise.all(backupCodes.map(code => bcrypt.hash(code, 12)));
        await this.tokensService.saveBackupCodes(userId, hashedCodes);
        await this.usersService.updateUser(userId, {
            isTwoFactorEnabled: true,
        });
        this.rabbitMqClient.emit('user.2fa_enabled', {
            userId,
            timestamp: new Date(),
        });
        return { backupCodes };
    }
    async disable2fa(userId, code) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            throw new common_1.BadRequestException('2FA not enabled');
        }
        const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
        const isValidCode = this.twoFactorService.verifyCode(decryptedSecret, code);
        const isValidBackup = await this.tokensService.verifyAndConsumeBackupCode(userId, code);
        if (!isValidCode && !isValidBackup) {
            throw new common_1.BadRequestException('Invalid 2FA code or backup code');
        }
        await this.usersService.updateUser(userId, {
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
        });
    }
    async generateTokens(userId, email, roles) {
        const jti = (0, uuid_1.v4)();
        const tokenId = (0, uuid_1.v4)();
        const payload = {
            sub: userId,
            email,
            roles: roles?.map(r => r.name) || [],
            jti,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign({ sub: userId, tokenId }, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        await this.tokensService.saveRefreshToken(userId, tokenId, refreshToken);
        return { accessToken, refreshToken };
    }
    async handleFailedLogin(user) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const updates = { failedLoginAttempts: attempts };
        if (attempts >= 5) {
            updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            this.rabbitMqClient.emit('user.account_locked', {
                userId: user.id,
                lockedUntil: updates.lockedUntil,
            });
        }
        await this.usersService.updateUser(user.id, updates);
    }
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    async findUserByResetToken(token) {
        const users = await this.usersService.findAll();
        for (const user of users) {
            if (user.passwordResetToken && user.passwordResetExpires > new Date()) {
                const isValid = await bcrypt.compare(token, user.passwordResetToken);
                if (isValid)
                    return user;
            }
        }
        return null;
    }
    sanitizeUser(user) {
        const { password, passwordResetToken, twoFactorSecret, ...sanitized } = user;
        return sanitized;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, common_2.Inject)('AUTH_SERVICE')),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        tokens_service_1.TokensService,
        mail_service_1.MailService,
        two_factor_service_1.TwoFactorService,
        jwt_1.JwtService,
        config_1.ConfigService,
        microservices_1.ClientProxy])
], AuthService);
//# sourceMappingURL=auth.service.js.map