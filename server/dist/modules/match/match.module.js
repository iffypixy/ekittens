"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const match_gateway_1 = require("./match.gateway");
let MatchModule = class MatchModule {
};
MatchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({
                name: "inactive",
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }, {
                name: "explosion",
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }, {
                name: "favor-response",
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }, {
                name: "play",
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }, {
                name: "spot-response",
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }),
        ],
        providers: [match_gateway_1.MatchGateway],
    })
], MatchModule);
exports.MatchModule = MatchModule;
//# sourceMappingURL=match.module.js.map