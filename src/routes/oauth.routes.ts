import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { oauthService } from "../services/oauth.service";
import { query } from "../config/database";
import { validateApiKey } from "../middleware/apiKey";

interface OAuthConnectionBody {
  provider_key: string;
  client_id: string;
  client_secret: string;
  scopes?: string[];
}

export async function oauthRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { provider: string };
    Querystring: { tenant_id?: string; redirect_uri?: string };
  }>(
    "/oauth/login/:provider",
    async (
      request: FastifyRequest<{
        Params: { provider: string };
        Querystring: { tenant_id?: string; redirect_uri?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const provider = request.params.provider;
      const successRedirectUri = request.query.redirect_uri;
      let tenantId =
        (request.headers["x-tenant-id"] as string) ||
        request.query.tenant_id ||
        "";

      if (!tenantId) {
        const apiKey = request.headers["x-api-key"] as string;
        if (apiKey) {
          const validKey = await validateApiKey(apiKey);
          if (validKey) {
            tenantId = validKey.tenant_id;
          }
        }
      }

      if (!tenantId) {
        return reply.status(400).send({ error: "missing_tenant" });
      }

      try {
        const connection = await oauthService.getConnection(tenantId, provider);

        if (!connection) {
          return reply.status(404).send({
            error: "provider_not_configured",
            message: `Provider ${provider} is not configured for this tenant`,
          });
        }

        const { redirectUrl } = await oauthService.beginLogin(
          connection.id,
          tenantId,
          successRedirectUri,
        );

        return reply.redirect(redirectUrl);
      } catch (error) {
        const err = error as Error;
        if (err.message === "redirect_uri_not_allowed") {
          return reply.status(400).send({ error: "redirect_uri_not_allowed" });
        }
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  fastify.get<{
    Params: { connectionId: string };
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };
  }>("/oauth/callback/:connectionId", async (request, reply) => {
    const { connectionId } = request.params;
    const { code, state, error, error_description } = request.query;

    if (error) {
      return reply.status(400).send({ error, message: error_description });
    }

    if (!code || !state) {
      return reply.status(400).send({
        error: "missing_parameters",
        message: "Missing code or state parameter",
      });
    }

    try {
      const { identity, successRedirectUri } =
        await oauthService.handleCallback(connectionId, code, state);

      const user = await oauthService.getUserByIdentity(identity);

      if (!user) {
        throw new Error("user_not_found");
      }

      const accessToken = fastify.jwt.sign({
        sub: user.id,
        tenant: identity.tenant_id,
        email: user.email,
        email_verified: user.email_verified,
      });

      const refreshToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await query(
        `INSERT INTO sessions (tenant_id, user_id, refresh_token, expires_at)
           VALUES ($1, $2, $3, $4)`,
        [identity.tenant_id, user.id, refreshToken, expiresAt],
      );

      const baseUrl = successRedirectUri || "http://localhost:3000/dashboard";
      const redirectUrl = new URL(baseUrl);
      redirectUrl.searchParams.set("access_token", accessToken);
      redirectUrl.searchParams.set("refresh_token", refreshToken);

      return reply.redirect(redirectUrl.toString());
    } catch (error) {
      const err = error as Error;
      console.error("OAuth callback error:", err);
      return reply.status(500).send({
        error: "callback_failed",
        message: err.message,
      });
    }
  });

  fastify.get(
    "/oauth/connections",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let tenantId = request.headers["x-tenant-id"] as string;

      if (!tenantId) {
        const apiKey = request.headers["x-api-key"] as string;
        if (apiKey) {
          const validKey = await validateApiKey(apiKey);
          if (validKey) {
            tenantId = validKey.tenant_id;
          }
        }
      }

      if (!tenantId) {
        return reply.status(400).send({ error: "missing_tenant" });
      }

      try {
        const connections = await oauthService.listConnections(tenantId);

        const safeConnections = connections.map((c) => ({
          id: c.id,
          provider_key: c.provider_key,
          enabled: c.enabled,
          scopes: c.scopes,
          created_at: c.created_at,
        }));

        return reply.send({ data: safeConnections });
      } catch (error) {
        const err = error as Error;
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  fastify.post<{ Body: OAuthConnectionBody }>(
    "/oauth/connections",
    async (
      request: FastifyRequest<{ Body: OAuthConnectionBody }>,
      reply: FastifyReply,
    ) => {
      let tenantId = request.headers["x-tenant-id"] as string;

      // Try to get tenant from API key if no tenant header
      if (!tenantId) {
        const apiKey = request.headers["x-api-key"] as string;
        if (apiKey) {
          const validKey = await validateApiKey(apiKey);
          if (validKey) {
            tenantId = validKey.tenant_id;
          }
        }
      }

      if (!tenantId) {
        return reply.status(400).send({ error: "missing_tenant" });
      }

      const { provider_key, client_id, client_secret, scopes } = request.body;

      if (!provider_key || !client_id || !client_secret) {
        return reply.status(400).send({
          error: "missing_fields",
          message: "provider_key, client_id, and client_secret are required",
        });
      }

      try {
        const connection = await oauthService.createConnection(
          tenantId,
          provider_key,
          client_id,
          client_secret,
          { scopes },
        );

        return reply.status(201).send({
          id: connection.id,
          provider_key: connection.provider_key,
          enabled: connection.enabled,
          scopes: connection.scopes,
        });
      } catch (error) {
        const err = error as Error;
        return reply.status(500).send({ error: err.message });
      }
    },
  );

  // Register allowed redirect URIs for a tenant
  fastify.put<{ Body: { redirect_uris: string[] } }>(
    "/oauth/allowed-redirects",
    async (
      request: FastifyRequest<{ Body: { redirect_uris: string[] } }>,
      reply: FastifyReply,
    ) => {
      let tenantId = request.headers["x-tenant-id"] as string;

      if (!tenantId) {
        const apiKey = request.headers["x-api-key"] as string;
        if (apiKey) {
          const validKey = await validateApiKey(apiKey);
          if (validKey) tenantId = validKey.tenant_id;
        }
      }

      if (!tenantId) {
        return reply.status(400).send({ error: "missing_tenant" });
      }

      const { redirect_uris } = request.body;

      if (!Array.isArray(redirect_uris)) {
        return reply
          .status(400)
          .send({ error: "redirect_uris must be an array" });
      }

      // Basic URL validation
      for (const uri of redirect_uris) {
        try {
          new URL(uri);
        } catch {
          return reply.status(400).send({ error: `invalid_uri: ${uri}` });
        }
      }

      try {
        await query(
          `UPDATE tenants SET allowed_redirect_uris = $1 WHERE id = $2`,
          [redirect_uris, tenantId],
        );

        return reply.send({ allowed_redirect_uris: redirect_uris });
      } catch (error) {
        const err = error as Error;
        return reply.status(500).send({ error: err.message });
      }
    },
  );
}
