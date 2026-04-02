import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI,
  authQueue: process.env.RABBITMQ_AUTH_QUEUE,
}));