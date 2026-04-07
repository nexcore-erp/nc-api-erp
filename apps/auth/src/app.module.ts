import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { RolesModule } from './roles/roles.module';
import { MailModule } from './mail/mail.module';
import { TwoFactorModule } from './two-factor/two-factor.module';

@Module({
  imports: [
    // Config global con validación Joi
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // SQL Server (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get('SQL_HOST'),
        port: parseInt(config.get('SQL_PORT') || '1433', 10),
        username: config.get('SQL_USERNAME'),
        password: config.get('SQL_PASSWORD'),
        database: config.get('SQL_DATABASE'),
        synchronize: config.get('TYPEORM_SYNCHRONIZE') === 'true',
        autoLoadEntities: true,
        options: {
          encrypt: false,
        },
      }),
      inject: [ConfigService],
    }),

    // RabbitMQ
    // Moved to AuthModule

    // Throttler (rate limiting global)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        ttl: Number(config.get('THROTTLE_TTL')) || 60,
        limit: Number(config.get('THROTTLE_LIMIT')) || 10,
      } as any),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    TokensModule,
    RolesModule,
    MailModule,
    TwoFactorModule,
  ],
})
export class AppModule {}