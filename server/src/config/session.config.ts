import {registerAs} from "@nestjs/config";

export const sessionConfig = registerAs("session", () => {
  const env = process.env;

  return {
    secret: env.SESSION_SECRET,
  };
});
