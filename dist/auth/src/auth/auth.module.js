"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const users_module_1 = require("../users/users.module");
const tokens_module_1 = require("../tokens/tokens.module");
const mail_module_1 = require("../mail/mail.module");
const two_factor_module_1 = require("../two-factor/two-factor.module");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_refresh_strategy_1 = require("./strategies/jwt-refresh.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const roles_guard_1 = require("./guards/roles.guard");
const roles_module_1 = require("../roles/roles.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            passport_1.PassportModule,
            microservices_1.ClientsModule.registerAsync([{
                    name: 'AUTH_SERVICE',
                    useFactory: (config) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [config.get('RABBITMQ_URI')],
                            queue: config.get('RABBITMQ_AUTH_QUEUE'),
                            queueOptions: { durable: true },
                        },
                    }),
                    inject: [config_1.ConfigService],
                }]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            tokens_module_1.TokensModule,
            roles_module_1.RolesModule,
            mail_module_1.MailModule,
            two_factor_module_1.TwoFactorModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            local_strategy_1.LocalStrategy,
            roles_guard_1.RolesGuard,
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map