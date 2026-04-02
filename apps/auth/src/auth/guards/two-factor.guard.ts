import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Get full user data
    const fullUser = await this.usersService.findById(user.id);

    if (fullUser?.isTwoFactorEnabled && !user.isTwoFactorAuthenticated) {
      throw new ForbiddenException('Se requiere verificación 2FA');
    }

    return true;
  }
}