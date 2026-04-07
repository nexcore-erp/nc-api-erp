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
exports.TwoFactorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const otplib_1 = require("otplib");
const QRCode = require("qrcode");
const crypto = require("crypto");
let TwoFactorService = class TwoFactorService {
    constructor(configService) {
        this.configService = configService;
        this.encryptionKey = this.configService.get('TWO_FACTOR_ENCRYPTION_KEY');
        otplib_1.authenticator.options = {
            digits: 6,
            period: 30,
        };
    }
    generateSecret() {
        return otplib_1.authenticator.generateSecret();
    }
    generateKeyUri(email, secret) {
        const appName = this.configService.get('TWO_FACTOR_APP_NAME');
        return otplib_1.authenticator.keyuri(email, appName, secret);
    }
    async generateQRCode(keyUri) {
        return QRCode.toDataURL(keyUri);
    }
    verifyCode(secret, code) {
        return otplib_1.authenticator.verify({ token: code, secret });
    }
    encryptSecret(secret) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decryptSecret(encryptedSecret) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TwoFactorService);
//# sourceMappingURL=two-factor.service.js.map