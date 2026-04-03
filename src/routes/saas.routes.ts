import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { SaaSService } from "../services/saas.service";
import { RegisterRequest, LoginRequest } from "../types/auth";
import { authenticateToken } from "../middleware/auth";
import {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from "../middleware/apiKey";
import { query } from "../config/database";

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
}

export async function saasRoutes(fastify: FastifyInstance) {
  const saasService = new SaaSService(fastify);

  // Public registration - creates tenant automatically
  fastify.post<{ Body: RegisterRequest }>(
    "/saas/register",
    async (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await saasService.register(request.body);
        return reply.status(201).send(result);
      } catch (error: any) {
        if (error.message === "USER_ALREADY_EXISTS") {
          return reply.status(409).send({
            error: "user_already_exists",
            message: "An account with this email already exists",
          });
        }
        return reply.status(400).send({
          error: "registration_failed",
          message: error.message,
        });
      }
    },
  );

  // Public login - works across all tenants
  fastify.post<{ Body: LoginRequest }>(
    "/saas/login",
    async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await saasService.login(request.body);
        return reply.send(result);
      } catch (error: any) {
        if (error.message === "INVALID_CREDENTIALS") {
          return reply.status(401).send({
            error: "invalid_credentials",
            message: "Invalid email or password",
          });
        }
        return reply.status(500).send({
          error: "login_failed",
          message: error.message,
        });
      }
    },
  );

  // Get current user info
  fastify.get(
    "/saas/me",
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }

        // Get user details
        const userResult = await query(
          `SELECT id, email, email_verified, created_at 
           FROM users WHERE id = $1`,
          [payload.sub],
        );

        if (userResult.rows.length === 0) {
          return reply.status(404).send({ error: "user_not_found" });
        }

        // Get tenant info
        const tenantResult = await query(
          `SELECT id, name, key, created_at 
           FROM tenants WHERE id = $1`,
          [payload.tenant],
        );

        return reply.send({
          user: userResult.rows[0],
          tenant: tenantResult.rows[0] || null,
        });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  // List API keys for the user's tenant
  fastify.get(
    "/saas/api-keys",
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

  // Create API key for the user's tenant
  fastify.post<{ Body: { name: string; expires_in_days?: number } }>(
    "/saas/api-keys",
    { preHandler: [authenticateToken] },
    async (
      request: FastifyRequest<{
        Body: { name: string; expires_in_days?: number };
      }>,
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
          key: apiKey, // Only returned once!
        });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  // Delete API key
  fastify.delete<{ Params: { id: string } }>(
    "/saas/api-keys/:id",
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

  // Get tenant stats
  fastify.get(
    "/saas/stats",
    { preHandler: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.jwtPayload;
        if (!payload) {
          return reply.status(401).send({ error: "unauthorized" });
        }

        const [userCount, sessionCount, apiKeyCount] = await Promise.all([
          query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [
            payload.tenant,
          ]),
          query(
            "SELECT COUNT(*) FROM sessions WHERE tenant_id = $1 AND revoked_at IS NULL",
            [payload.tenant],
          ),
          query("SELECT COUNT(*) FROM api_keys WHERE tenant_id = $1", [
            payload.tenant,
          ]),
        ]);

        return reply.send({
          total_users: parseInt(userCount.rows[0].count),
          active_sessions: parseInt(sessionCount.rows[0].count),
          total_api_keys: parseInt(apiKeyCount.rows[0].count),
        });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  // SaaS Google OAuth — initiates login/register without an existing tenant
  fastify.get<{ Params: { provider: string } }>(
    "/saas/oauth/login/:provider",
    async (request, reply) => {
      const { provider } = request.params;
      if (provider !== "google") {
        return reply.status(400).send({ error: "unsupported_provider" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return reply.status(500).send({ error: "google_oauth_not_configured" });
      }

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Encode state as a signed JWT so we don't need extra DB storage
      const state = fastify.jwt.sign(
        { code_verifier: codeVerifier, jti: crypto.randomUUID() },
        { expiresIn: "10m" } as any,
      );

      const callbackBase = process.env.OAUTH_CALLBACK_BASE;
      const redirectUri = `${callbackBase}/saas/oauth/callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
      });

      return reply.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      );
    },
  );

  // SaaS Google OAuth callback — creates tenant+user if needed, returns tokens
  fastify.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };
  }>("/saas/oauth/callback", async (request, reply) => {
    const frontendRedirect = process.env.OAUTH_SUCCESS_REDIRECT;
    const { code, state, error } = request.query;

    if (error) {
      return reply.redirect(`${frontendRedirect}?error=${error}`);
    }

    if (!code || !state) {
      return reply.redirect(`${frontendRedirect}?error=missing_parameters`);
    }

    try {
      const statePayload = fastify.jwt.verify<{ code_verifier: string }>(state);

      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const callbackBase = process.env.OAUTH_CALLBACK_BASE;
      const redirectUri = `${callbackBase}/saas/oauth/callback`;

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: statePayload.code_verifier,
      });

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const text = await tokenResponse.text();
        throw new Error(`token_exchange_failed: ${text}`);
      }

      const tokens: any = await tokenResponse.json();

      // Get email from userinfo
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );

      if (!userInfoResponse.ok) {
        throw new Error("userinfo_fetch_failed");
      }

      const profile: any = await userInfoResponse.json();
      const email: string = profile.email;

      if (!email) {
        throw new Error("email_not_provided_by_google");
      }

      const authResult = await saasService.loginOrRegisterWithGoogle(email);

      if (!frontendRedirect) {
        throw new Error("OAUTH_SUCCESS_REDIRECT must be configured");
      }
      const redirectUrl = new URL(frontendRedirect);
      redirectUrl.searchParams.set("access_token", authResult.access_token);
      redirectUrl.searchParams.set("refresh_token", authResult.refresh_token);

      return reply.redirect(redirectUrl.toString());
    } catch (err: any) {
      console.error("SaaS OAuth callback error:", err);
      return reply.redirect(
        `${frontendRedirect}?error=${encodeURIComponent(err.message)}`,
      );
    }
  });
}
