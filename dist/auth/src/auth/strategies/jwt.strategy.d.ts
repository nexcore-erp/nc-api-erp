import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokensService } from '../../tokens/tokens.service';
import { UsersService } from '../../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private tokensService;
    private usersService;
    constructor(configService: ConfigService, tokensService: TokensService, usersService: UsersService);
    validate(payload: any): Promise<{
        id: any;
        email: string;
        roles: import("../../roles/schemas/role.schema").Role[];
        isTwoFactorAuthenticated: any;
    }>;
}
export {};
