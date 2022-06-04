"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = void 0;
const config_1 = require("@nestjs/config");
exports.redisConfig = (0, config_1.registerAs)("redis", () => {
    const env = process.env;
    return {
        host: env.REDIS_HOST,
        port: parseInt(env.REDIS_PORT, 10),
    };
});
//# sourceMappingURL=redis.config.js.map