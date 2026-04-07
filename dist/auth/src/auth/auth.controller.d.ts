import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, user: any): Promise<import("./dto/responses.dto").AuthResponseDto>;
    logout(user: any, accessToken: string): Promise<void>;
    refresh(refreshTokenDto: RefreshTokenDto, user: any): Promise<import("./dto/responses.dto").TokensDto>;
    register(registerDto: RegisterDto): Promise<any>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
    setup2fa(user: any): Promise<import("./dto/responses.dto").TwoFactorSetupDto>;
    confirm2fa(user: any, enable2faDto: Enable2faDto): Promise<import("./dto/responses.dto").BackupCodesDto>;
    disable2fa(user: any, verify2faDto: Verify2faDto): Promise<void>;
    getProfile(user: any): Promise<any>;
}
