import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.db,
  user: config.postgres.user,
  password: config.postgres.password,
});

// Don't register error handler during testing
if (process.env.NODE_ENV !== 'test') {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}