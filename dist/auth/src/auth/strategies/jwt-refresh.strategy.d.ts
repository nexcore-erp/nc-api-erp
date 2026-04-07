import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokensService } from '../../tokens/tokens.service';
import { UsersService } from '../../users/users.service';
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private configService;
    private tokensService;
    private usersService;
    constructor(configService: ConfigService, tokensService: TokensService, usersService: UsersService);
    validate(req: Request, payload: any): Promise<{
        id: any;
        email: string;
    }>;
}
export {};
