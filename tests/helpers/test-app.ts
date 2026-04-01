import { FastifyInstance } from 'fastify';
import { buildApp } from './build-app';
import { pool } from '../../src/config/database';

let app: FastifyInstance;

export async function getApp(): Promise<FastifyInstance> {
  if (app) {
    return app;
  }

  app = await buildApp();
  return app;
}

export async function teardownApp() {
  if (app) {
    await app.close();
    app = null as any;
  }
}

export async function cleanDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Truncate all tables in correct order (respect foreign keys)
    await client.query('TRUNCATE TABLE audit_logs CASCADE');
    await client.query('TRUNCATE TABLE user_roles CASCADE');
    await client.query('TRUNCATE TABLE email_verification_tokens CASCADE');
    await client.query('TRUNCATE TABLE password_reset_tokens CASCADE');
    await client.query('TRUNCATE TABLE sessions CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');
    await client.query('TRUNCATE TABLE roles CASCADE');
    await client.query('TRUNCATE TABLE tenants CASCADE');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
