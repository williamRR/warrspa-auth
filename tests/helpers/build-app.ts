import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from '../../src/config/env';
import { authRoutes } from '../../src/routes/auth.routes';
import { tenantMiddleware } from '../../src/middleware/tenant';

export async function buildApp() {
  const app = Fastify({
    logger: false, // Disable logger in tests
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(jwt, {
    secret: config.jwtSecret,
  });

  // Health check endpoint
  app.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Apply tenant middleware to all routes except health check
  app.addHook('onRequest', async (request, reply) => {
    if (request.url !== '/health') {
      return tenantMiddleware(request, reply);
    }
  });

  // Register auth routes
  await app.register(authRoutes);

  // Test route for tenant middleware verification
  app.get('/auth/test', async (request, _reply) => {
    return {
      message: 'Tenant middleware is working',
      tenantId: request.tenantId,
    };
  });

  return app;
}
