process.loadEnvFile();

const _env = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  DEFAULT_SENDER_EMAIL: process.env.DEFAULT_SENDER_EMAIL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
};

export const env = {
  get: (key: keyof typeof _env) => {
    return _env[key];
  },
};