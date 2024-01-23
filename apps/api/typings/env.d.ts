export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development";
      DB_HOST: string;
      DB_PORT: string;
      DB_USERNAME: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_SYNCHRONIZE: string;
      SESSION_SECRET: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      CLIENT_ORIGIN: string;
      S3_ACCESS_KEY: string;
      S3_SECRET_ACCESS_KEY: string;
      S3_BUCKET_NAME: string;
    }
  }
}
