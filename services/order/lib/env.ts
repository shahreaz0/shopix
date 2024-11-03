process.loadEnvFile();

const _env = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  PRODUCT_SERVICE_BASE_URL: process.env.PRODUCT_SERVICE_BASE_URL,
  EMAIL_SERVICE_BASE_URL: process.env.EMAIL_SERVICE_BASE_URL,
  CART_SERVICE_BASE_URL: process.env.CART_SERVICE_BASE_URL,
};

export const env = {
  get: (key: keyof typeof _env) => {
    return _env[key];
  },
};
