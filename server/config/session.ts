import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from '../db';
import { config } from './environment';

const PostgresSessionStore = connectPg(session);

export const sessionConfig: session.SessionOptions = {
  store: new PostgresSessionStore({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.session.secure,
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: 'lax',
  },
  name: 'aetherrun.sid',
};

// Redis session configuration (for production scaling)
export function createRedisSessionConfig() {
  if (!config.redis.url) {
    throw new Error('Redis URL is required for Redis session store');
  }

  // This would require redis and connect-redis packages
  // For now, we'll use PostgreSQL sessions
  return sessionConfig;
}

