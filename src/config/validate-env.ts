import { ENV_KEYS } from 'src/constants/env-keys';
import z from 'zod';

export type EnvSchema = z.infer<typeof envSchema>;

export const envSchema = z.object({
  [ENV_KEYS.REDIS_HOST]: z.string().nonempty(),
  [ENV_KEYS.REDIS_PORT]: z.string().nonempty(),
  [ENV_KEYS.BRAVE_SEARCH_API_KEY]: z.string().nonempty(),
  [ENV_KEYS.GOOGLE_GENERATIVE_AI_API_KEY]: z.string().nonempty(),
});

export const validateEnv = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);

  if (!result.success) throw new Error(result.error.message);

  return result.data;
};
