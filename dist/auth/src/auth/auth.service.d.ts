import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { MailService } from '../mail/mail.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto, TokensDto, TwoFactorSetupDto, BackupCodesDto } from './dto/responses.dto';
export declare class AuthService {
    private usersService;
    private tokensService;
    private mailService;
    private twoFactorService;
    private jwtService;
    private configService;
    private rabbitMqClient;
    constructor(usersService: UsersService, tokensService: TokensService, mailService: MailService, twoFactorService: TwoFactorService, jwtService: JwtService, configService: ConfigService, rabbitMqClient: ClientProxy);
    validateUser(email: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    refreshTokens(userId: string, refreshToken: string): Promise<TokensDto>;
    logout(userId: string, accessToken: string): Promise<void>;
    register(registerDto: RegisterDto): Promise<any>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
    enable2fa(userId: string): Promise<TwoFactorSetupDto>;
    confirm2fa(userId: string, code: string): Promise<BackupCodesDto>;
    disable2fa(userId: string, code: string): Promise<void>;
    private generateTokens;
    private handleFailedLogin;
    private generateResetToken;
    private findUserByResetToken;
    private sanitizeUser;
}
