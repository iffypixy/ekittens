"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const websocket_1 = require("./lib/websocket");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: {
            credentials: true,
            origin: process.env.CLIENT_ORIGIN,
        },
    });
    app.useWebSocketAdapter(new websocket_1.WebSocketAdapter(app, true));
    await app.listen(5000);
}
bootstrap();
//# sourceMappingURL=main.js.map