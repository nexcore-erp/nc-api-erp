import { ConfigService } from '@nestjs/config';
export declare class TwoFactorService {
    private configService;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    generateSecret(): string;
    generateKeyUri(email: string, secret: string): string;
    generateQRCode(keyUri: string): Promise<string>;
    verifyCode(secret: string, code: string): boolean;
    encryptSecret(secret: string): string;
    decryptSecret(encryptedSecret: string): string;
    generateBackupCodes(count?: number): string[];
}
