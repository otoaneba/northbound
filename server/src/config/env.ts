import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

interface Env {
  PORT: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV: string;
}

export const env: Env = {
  PORT: process.env.PORT ?? '5050',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  PLAID_CLIENT_ID: requireEnv('PLAID_CLIENT_ID'),
  PLAID_SECRET: requireEnv('PLAID_SANDBOX_SECRET'),
  PLAID_ENV: process.env.PLAID_ENV ?? 'sandbox',
};