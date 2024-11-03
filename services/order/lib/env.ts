process.loadEnvFile();

const _env = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  INVENTORY_BASE_URL: process.env.INVENTORY_BASE_URL,
};

export const env = {
  get: (key: keyof typeof _env) => {
    return _env[key];
  },
};
