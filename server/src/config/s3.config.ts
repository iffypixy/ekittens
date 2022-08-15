import {registerAs} from "@nestjs/config";

export const s3Config = registerAs("s3", () => {
  const env = process.env;

  return {
    accessKey: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucketName: env.S3_BUCKET_NAME,
  };
});
