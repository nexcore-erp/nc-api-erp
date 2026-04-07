import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/tokens.module';
import { MailModule } from '../mail/mail.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    ClientsModule.registerAsync([{
      name: 'AUTH_SERVICE',
      useFactory: (config: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [config.get<string>('RABBITMQ_URI')],
          queue: config.get<string>('RABBITMQ_AUTH_QUEUE'),
          queueOptions: { durable: true },
        },
      }),
      inject: [ConfigService],
    }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    TokensModule,
    RolesModule,
    MailModule,
    TwoFactorModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    RolesGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}