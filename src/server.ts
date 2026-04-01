import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config/env";
import { tenantMiddleware } from "./middleware/tenant";
import { rateLimit } from "./middleware/rateLimit";
import { authRoutes } from "./routes/auth.routes";
import { adminRoutes } from "./routes/admin.routes";
import { saasRoutes } from "./routes/saas.routes";
import { oauthRoutes } from "./routes/oauth.routes";
import { platformRoutes } from "./routes/platform.routes";

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Tenant-ID",
    "X-API-Key",
    "X-Platform-Secret",
  ],
});

fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Swagger
fastify.register(swagger, {
  openapi: {
    info: {
      title: "Auth WarrSPA API",
      description: "Multi-tenant authentication API",
      version: "1.0.0",
    },
  },
});

fastify.register(swaggerUi, {
  routePrefix: "/docs",
});

// Health check endpoint (no tenant required)
fastify.get("/health", async (_request, _reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// SaaS routes - public registration/login, no tenant required
fastify.register(saasRoutes);

// OAuth routes - public login endpoints, callback needs tenant validation handled internally
fastify.register(oauthRoutes);

// Apply tenant middleware and rate limiting to all routes except health, saas, and oauth
fastify.addHook("onRequest", async (request, reply) => {
  if (
    request.url === "/health" ||
    request.url.startsWith("/saas") ||
    request.url.startsWith("/oauth/login") ||
    request.url.startsWith("/oauth/callback") ||
    request.url.startsWith("/saas/oauth") ||
    request.url.startsWith("/platform")
  ) {
    return;
  }

  // For /oauth/connections, try to get tenant from API key first
  if (request.url.startsWith("/oauth/connections")) {
    return;
  }

  await tenantMiddleware(request, reply);
  await rateLimit()(request, reply);
});

// Auth routes with tenant validation
fastify.register(authRoutes);

// Admin routes with API key authentication
fastify.register(adminRoutes);

// Platform routes — gestión de tenants (protegido por PLATFORM_SECRET)
fastify.register(platformRoutes);

// Test route for tenant middleware verification
fastify.get("/auth/test", async (request, _reply) => {
  return {
    message: "Tenant middleware is working",
    tenantId: request.tenantId,
  };
});

// Start server
async function start() {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`Server listening on ${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
