export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development";
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_SYNCHRONIZE: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      CLIENT_ORIGIN: string;
    }
  }
}
