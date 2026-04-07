import { Role } from '../../roles/schemas/role.schema';
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: Role[];
    isActive: boolean;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    twoFactorSecret?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
