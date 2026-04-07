"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT) || 1433,
    username: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
}));
//# sourceMappingURL=db.config.js.map