import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  validateApiKey,
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from "../middleware/apiKey";
import { query } from "../config/database";
import {
  CreateApiKeyRequest,
  ApiKeyResponse,
  ListQueryParams,
} from "../types/auth";

declare module "fastify" {
  interface FastifyRequest {
    apiKeyTenantId?: string;
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const apiKey = request.headers["x-api-key"] as string;

      if (!apiKey) {
        return reply.status(401).send({
          error: "missing_api_key",
          message: "X-API-Key header is required",
        });
      }

      const validKey = await validateApiKey(apiKey);
      if (!validKey) {
        return reply.status(401).send({
          error: "invalid_api_key",
          message: "Invalid or expired API key",
        });
      }

      request.apiKeyTenantId = validKey.tenant_id;
    },
  );

  fastify.get<{ Querystring: ListQueryParams }>(
    "/admin/users",
    async (
      request: FastifyRequest<{ Querystring: ListQueryParams }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const page = parseInt(String(request.query.page)) || 1;
      const limit = parseInt(String(request.query.limit)) || 20;
      const offset = (page - 1) * limit;

      const countResult = await query(
        "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
        [tenantId],
      );

      const result = await query(
        `SELECT id, email, email_verified, created_at, updated_at 
         FROM users WHERE tenant_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset],
      );

      return reply.send({
        data: result.rows,
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/admin/users/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const userId = request.params.id;

      const result = await query(
        `SELECT id, email, email_verified, created_at, updated_at 
         FROM users WHERE tenant_id = $1 AND id = $2`,
        [tenantId, userId],
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "user_not_found" });
      }

      return reply.send(result.rows[0]);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/users/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const userId = request.params.id;

      const result = await query(
        "DELETE FROM users WHERE tenant_id = $1 AND id = $2 RETURNING id",
        [tenantId, userId],
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "user_not_found" });
      }

      await logAudit(
        tenantId!,
        null!,
        "user_deleted",
        "user",
        userId!,
        request,
      );

      return reply.status(204).send();
    },
  );

  fastify.get<{ Querystring: ListQueryParams }>(
    "/admin/api-keys",
    async (
      request: FastifyRequest<{ Querystring: ListQueryParams }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;

      const result = await query(
        `SELECT id, name, prefix, last_used_at, expires_at, created_at 
         FROM api_keys WHERE tenant_id = $1 
         ORDER BY created_at DESC`,
        [tenantId],
      );

      return reply.send({ data: result.rows });
    },
  );

  fastify.post<{ Body: CreateApiKeyRequest }>(
    "/admin/api-keys",
    async (
      request: FastifyRequest<{ Body: CreateApiKeyRequest }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
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
        [tenantId, name, keyHash, prefix, expiresAt],
      );

      await logAudit(
        tenantId!,
        null,
        "api_key_created",
        "api_key",
        String((result.rows[0] as any).id),
        request,
      );

      const response: ApiKeyResponse = {
        ...result.rows[0],
        key: apiKey,
      };

      return reply.status(201).send(response);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/api-keys/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const keyId = request.params.id as string;

      if (!keyId) {
        return reply.status(400).send({ error: "invalid_id" });
      }

      const result = await query(
        "DELETE FROM api_keys WHERE tenant_id = $1 AND id = $2 RETURNING id",
        [tenantId, keyId],
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "api_key_not_found" });
      }

      await logAudit(
        tenantId!,
        null,
        "api_key_revoked",
        "api_key",
        keyId!,
        request,
      );

      return reply.status(204).send();
    },
  );

  fastify.get<{ Querystring: ListQueryParams }>(
    "/admin/sessions",
    async (
      request: FastifyRequest<{ Querystring: ListQueryParams }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const page = parseInt(String(request.query.page)) || 1;
      const limit = parseInt(String(request.query.limit)) || 20;
      const offset = (page - 1) * limit;

      const countResult = await query(
        "SELECT COUNT(*) FROM sessions WHERE tenant_id = $1 AND revoked_at IS NULL",
        [tenantId],
      );

      const result = await query(
        `SELECT s.id, s.user_id, s.user_agent, s.ip_address, s.created_at, s.expires_at, u.email
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.tenant_id = $1 AND s.revoked_at IS NULL
         ORDER BY s.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset],
      );

      return reply.send({
        data: result.rows,
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/sessions/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const sessionId = request.params.id;

      const result = await query(
        "UPDATE sessions SET revoked_at = NOW() WHERE tenant_id = $1 AND id = $2 AND revoked_at IS NULL RETURNING id",
        [tenantId, sessionId],
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "session_not_found" });
      }

      await logAudit(
        tenantId!,
        null,
        "session_revoked",
        "session",
        sessionId!,
        request,
      );

      return reply.status(204).send();
    },
  );

  fastify.get(
    "/admin/stats",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.apiKeyTenantId;

      const [userCount, sessionCount, apiKeyCount] = await Promise.all([
        query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [tenantId]),
        query(
          "SELECT COUNT(*) FROM sessions WHERE tenant_id = $1 AND revoked_at IS NULL",
          [tenantId],
        ),
        query("SELECT COUNT(*) FROM api_keys WHERE tenant_id = $1", [tenantId]),
      ]);

      const last7DaysUsers = await query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [tenantId],
      );

      return reply.send({
        total_users: parseInt(userCount.rows[0].count),
        active_sessions: parseInt(sessionCount.rows[0].count),
        total_api_keys: parseInt(apiKeyCount.rows[0].count),
        new_users_last_7_days: parseInt(last7DaysUsers.rows[0].count),
      });
    },
  );

  fastify.get<{ Querystring: ListQueryParams }>(
    "/admin/audit-logs",
    async (
      request: FastifyRequest<{ Querystring: ListQueryParams }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.apiKeyTenantId;
      const page = parseInt(String(request.query.page)) || 1;
      const limit = parseInt(String(request.query.limit)) || 50;
      const offset = (page - 1) * limit;

      const countResult = await query(
        "SELECT COUNT(*) FROM audit_logs WHERE tenant_id = $1",
        [tenantId],
      );

      const result = await query(
        `SELECT id, user_id, action, resource, resource_id, ip_address, metadata, created_at
         FROM audit_logs WHERE tenant_id = $1
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset],
      );

      return reply.send({
        data: result.rows,
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      });
    },
  );
}

async function logAudit(
  tenantId: string,
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  request: FastifyRequest,
) {
  await query(
    `INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      request.ip,
      request.headers["user-agent"] as string,
    ],
  );
}
