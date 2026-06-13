import { z as zod } from "zod";

/** Environment configuration, parsed and validated once at boot (fail closed). */
const schema = zod.object({
  NODE_ENV: zod.enum(["development", "test", "production"]).default("development"),
  HOST: zod.string().default("0.0.0.0"),
  PORT: zod.coerce.number().int().positive().default(8000),
  DATABASE_URL: zod.string().min(1),
  REDIS_URL: zod.string().min(1),
  SESSION_SECRET: zod.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  SESSION_TTL_SECONDS: zod.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),
  CORS_ORIGIN: zod.string().default("http://localhost:5173"),
});

export type Config = zod.infer<typeof schema>;

/** Parse process env into a validated config, throwing with a clear report on failure. */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
};
