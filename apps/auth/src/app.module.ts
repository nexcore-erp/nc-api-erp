import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

    // MongoDB
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
        dbName: 'nextcore_auth',
      }),
      inject: [ConfigService],
    }),

    // RabbitMQ
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

    // Throttler (rate limiting global)
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [{
        ttl: config.get('THROTTLE_TTL'),
        limit: config.get('THROTTLE_LIMIT'),
      }],
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