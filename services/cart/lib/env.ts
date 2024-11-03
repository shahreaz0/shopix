process.loadEnvFile();

const _env = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  CART_TTL: process.env.CART_TTL,
  INVENTORY_BASE_URL: process.env.INVENTORY_BASE_URL,
};

export const env = {
  get: (key: keyof typeof _env) => {
    if (!_env[key]) throw new Error("Env not found");
    return _env[key];
  },
};
