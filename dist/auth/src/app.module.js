"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const env_validation_1 = require("./config/env.validation");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const tokens_module_1 = require("./tokens/tokens.module");
const roles_module_1 = require("./roles/roles.module");
const mail_module_1 = require("./mail/mail.module");
const two_factor_module_1 = require("./two-factor/two-factor.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
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
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    ttl: Number(config.get('THROTTLE_TTL')) || 60,
                    limit: Number(config.get('THROTTLE_LIMIT')) || 10,
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tokens_module_1.TokensModule,
            roles_module_1.RolesModule,
            mail_module_1.MailModule,
            two_factor_module_1.TwoFactorModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map