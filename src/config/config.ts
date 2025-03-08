import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  DATABASE_URL: process.env.DATABASE_URL,
  NATS_SERVERS: process.env.NATS_SERVERS,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
}));
