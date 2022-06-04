"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterService = void 0;
const common_1 = require("@nestjs/common");
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
let ClusterService = class ClusterService {
    static clusterize(callback) {
        const isProd = process.env.NODE_ENV === "production";
        if (cluster_1.default.isPrimary) {
            console.log(`Primary ${process.pid} is running`);
            const cpus = os_1.default.cpus().length;
            for (let i = 0; i < cpus; i++) {
                cluster_1.default.fork();
            }
            cluster_1.default.on("exit", (worker) => {
                console.log(`Worker ${worker.process.pid} died. Restarting`);
                cluster_1.default.fork();
            });
        }
        else {
            console.log(`Worker ${process.pid} is running`);
            callback();
        }
    }
};
ClusterService = __decorate([
    (0, common_1.Injectable)()
], ClusterService);
exports.ClusterService = ClusterService;
//# sourceMappingURL=index.js.map