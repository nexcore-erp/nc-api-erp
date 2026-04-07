import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Get user roles with permissions
    const userRoles = await Promise.all(
      user.roles.map((roleId: string) => this.rolesService.findById(roleId)),
    );

    // Check if user has any of the required roles
    const userRoleNames = userRoles.filter(role => role).map(role => role.name);
    return requiredRoles.some(role => userRoleNames.includes(role));
  }
}