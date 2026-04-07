import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT) || 1433,
  username: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
}));