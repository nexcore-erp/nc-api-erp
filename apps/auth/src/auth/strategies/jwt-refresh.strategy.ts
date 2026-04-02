import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokensService } from '../../tokens/tokens.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private tokensService: TokensService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const { sub: userId, tokenId } = payload;
    const refreshToken = req.body.refreshToken;

    // Verify refresh token exists and matches
    const storedToken = await this.tokensService.getRefreshToken(userId, tokenId);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Attach refresh token to request for rotation
    req.body.refreshToken = refreshToken;
    req.body.userId = userId;
    req.body.tokenId = tokenId;

    return { id: (user as any)._id, email: user.email };
  }
}