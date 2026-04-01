import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { query } from "../config/database";
import {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from "../middleware/apiKey";

/**
 * Platform routes — administración del sistema auth_warrspa.
 * Protegidos por X-Platform-Secret (secret maestro, solo para el operador).
 * Sirven para crear/listar/eliminar tenants (una app = un tenant).
 */
export async function platformRoutes(fastify: FastifyInstance) {
  // Auth: X-Platform-Secret
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const secret = request.headers["x-platform-secret"] as string;
      const expected = process.env.PLATFORM_SECRET;

      if (!expected) {
        return reply
          .status(500)
          .send({ error: "platform_secret_not_configured" });
      }

      if (!secret || secret !== expected) {
        return reply.status(401).send({ error: "invalid_platform_secret" });
      }
    },
  );

  // POST /platform/tenants — crear un tenant nuevo (= una nueva app)
  fastify.post<{
    Body: { name: string; key: string; allowed_redirect_uris?: string[] };
  }>("/platform/tenants", async (request, reply) => {
    const { name, key, allowed_redirect_uris = [] } = request.body;

    if (!name || !key) {
      return reply.status(400).send({ error: "name and key are required" });
    }

    // key debe ser slug-friendly
    if (!/^[a-z0-9_-]+$/.test(key)) {
      return reply.status(400).send({
        error: "key must be lowercase alphanumeric with hyphens/underscores",
      });
    }

    const existing = await query("SELECT id FROM tenants WHERE key = $1", [
      key,
    ]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: "tenant_key_already_exists" });
    }

    // Crear el tenant
    const tenantResult = await query(
      `INSERT INTO tenants (name, key, allowed_redirect_uris)
       VALUES ($1, $2, $3)
       RETURNING id, name, key, allowed_redirect_uris, created_at`,
      [name, key, allowed_redirect_uris],
    );

    const tenant = tenantResult.rows[0];

    // Crear API key inicial para el tenant
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const prefix = getApiKeyPrefix(apiKey);

    await query(
      `INSERT INTO api_keys (tenant_id, name, key_hash, prefix)
       VALUES ($1, $2, $3, $4)`,
      [tenant.id, `${name} default key`, keyHash, prefix],
    );

    return reply.status(201).send({
      tenant,
      api_key: apiKey, // Solo se muestra una vez
    });
  });

  // GET /platform/tenants — listar todos los tenants
  fastify.get("/platform/tenants", async (_request, reply) => {
    const result = await query(
      `SELECT id, name, key, allowed_redirect_uris, created_at
       FROM tenants ORDER BY created_at DESC`,
    );
    return reply.send({ data: result.rows });
  });

  // DELETE /platform/tenants/:id — eliminar un tenant y todos sus datos
  fastify.delete<{ Params: { id: string } }>(
    "/platform/tenants/:id",
    async (request, reply) => {
      const { id } = request.params;

      const result = await query(
        "DELETE FROM tenants WHERE id = $1 RETURNING id, name, key",
        [id],
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "tenant_not_found" });
      }

      return reply.send({ deleted: result.rows[0] });
    },
  );
}
