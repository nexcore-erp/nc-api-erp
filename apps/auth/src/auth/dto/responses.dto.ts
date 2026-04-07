export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorSetupDto {
  qrCode: string;
  secret: string;
}

export interface BackupCodesDto {
  backupCodes: string[];
}