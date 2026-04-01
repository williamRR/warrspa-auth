import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/auth.service";
import { RegisterRequest, LoginRequest, RefreshRequest, CreateApiKeyRequest } from "../types/auth";
import { authenticateToken } from "../middleware/auth";
import { generateApiKey, hashApiKey, getApiKeyPrefix } from "../middleware/apiKey";
import { query } from "../config/database";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify);

  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.headers["x-tenant-id"] as string;
      if (!tenantId) {
        return reply.status(400).send({
          error: "missing_tenant",
          message: "X-Tenant-ID header is required",
        });
      }
      (request as any).tenantId = tenantId;
    },
  );

  fastify.post<{ Body: RegisterRequest }>(
    "/auth/register",
    async (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const tenantId = (request as any).tenantId;
        const result = await authService.register(tenantId, request.body);
        return reply.send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.post<{ Body: LoginRequest }>(
    "/auth/login",
    async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const tenantId = (request as any).tenantId;
        const result = await authService.login(tenantId, request.body);
        return reply.send(result);
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    },
  );

  fastify.post<{ Body: RefreshRequest }>(
    "/auth/refresh",
    async (
      request: FastifyRequest<{ Body: RefreshRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await authService.refreshToken(
          request.body.refresh_token,
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    },
  );

  fastify.post(
    "/auth/logout",
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.jwtPayload;
        if (payload) {
          await authService.logout(
            request.headers.authorization?.replace("Bearer ", "") || "",
          );
        }
        return reply.send({ message: "Logged out successfully" });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/auth/me",
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }
        const user = await authService.getUserById(payload.sub);
        if (!user) {
          return reply.status(404).send({ error: "user_not_found" });
        }
        return reply.send({
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          user_metadata: user.user_metadata,
        });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    },
  );

  // API Keys management endpoints (JWT authenticated)
  fastify.get(
    "/auth/api-keys",
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }

        const result = await query(
          `SELECT id, name, prefix, last_used_at, expires_at, created_at 
           FROM api_keys WHERE tenant_id = $1 
           ORDER BY created_at DESC`,
          [payload.tenant],
        );

        return reply.send({ data: result.rows });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.post<{ Body: CreateApiKeyRequest }>(
    "/auth/api-keys",
    { preHandler: [authenticateToken] },
    async (
      request: FastifyRequest<{ Body: CreateApiKeyRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }

        const { name, expires_in_days } = request.body;
        if (!name) {
          return reply.status(400).send({ error: "name_required" });
        }

        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);
        const prefix = getApiKeyPrefix(apiKey);

        const expiresAt = expires_in_days
          ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
          : null;

        const result = await query(
          `INSERT INTO api_keys (tenant_id, name, key_hash, prefix, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, prefix, expires_at, created_at`,
          [payload.tenant, name, keyHash, prefix, expiresAt],
        );

        return reply.status(201).send({
          ...result.rows[0],
          key: apiKey,
        });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/auth/api-keys/:id",
    { preHandler: [authenticateToken] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }

        const keyId = request.params.id;
        const result = await query(
          "DELETE FROM api_keys WHERE tenant_id = $1 AND id = $2 RETURNING id",
          [payload.tenant, keyId],
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({ error: "api_key_not_found" });
        }

        return reply.status(204).send();
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );
}
