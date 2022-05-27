import {Injectable} from "@nestjs/common";
import cluster from "cluster";
import os from "os";
import bull from "bull";

@Injectable()
export class ClusterService {
  static clusterize(callback: Function): void {
    const isProd = process.env.NODE_ENV === "production";

    if (cluster.isPrimary) {
      console.log(`Primary ${process.pid} is running`);

      const cpus = os.cpus().length;

      for (let i = 0; i < cpus; i++) {
        cluster.fork();
      }

      cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died. Restarting`);

        cluster.fork();
      });
    } else {
      console.log(`Worker ${process.pid} is running`);

      callback();
    }
  }
}
