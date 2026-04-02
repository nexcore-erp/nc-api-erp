import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get('TWO_FACTOR_ENCRYPTION_KEY');
    authenticator.options = {
      digits: 6,
      period: 30,
    };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateKeyUri(email: string, secret: string): string {
    const appName = this.configService.get('TWO_FACTOR_APP_NAME');
    return authenticator.keyuri(email, appName, secret);
  }

  async generateQRCode(keyUri: string): Promise<string> {
    return QRCode.toDataURL(keyUri);
  }

  verifyCode(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  encryptSecret(secret: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decryptSecret(encryptedSecret: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}