"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('rabbitmq', () => ({
    uri: process.env.RABBITMQ_URI,
    authQueue: process.env.RABBITMQ_AUTH_QUEUE,
}));
//# sourceMappingURL=rabbitmq.config.js.map