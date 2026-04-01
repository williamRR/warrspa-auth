import crypto from "crypto";
import { query } from "../config/database";
import type { TenantOAuthConnection, Identity } from "../types/oauth";

const ENCRYPTION_KEY =
  process.env.OAUTH_ENCRYPTION_KEY || "default-change-this-32ch";
const CALLBACK_BASE =
  process.env.OAUTH_CALLBACK_BASE || "http://localhost:3002";

const PROVIDER_PRESETS: Record<string, Partial<TenantOAuthConnection>> = {
  google: {
    issuer: "https://accounts.google.com",
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    userinfo_endpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
    jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
    scopes: ["openid", "email", "profile"],
    claim_mapping: {
      subjectPath: "sub",
      emailPath: "email",
      emailVerifiedPath: "email_verified",
      namePath: "name",
      avatarPath: "picture",
    },
  },
  github: {
    issuer: "https://github.com",
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    token_endpoint: "https://github.com/login/oauth/access_token",
    userinfo_endpoint: "https://api.github.com/user",
    scopes: ["read:user", "user:email"],
    claim_mapping: {
      subjectPath: "id",
      emailPath: "email",
      namePath: "name",
      avatarPath: "avatar_url",
    },
  },
  discord: {
    issuer: "https://discord.com",
    authorization_endpoint: "https://discord.com/api/oauth2/authorize",
    token_endpoint: "https://discord.com/api/oauth2/token",
    userinfo_endpoint: "https://discord.com/api/users/@me",
    scopes: ["identify", "email"],
    claim_mapping: {
      subjectPath: "id",
      emailPath: "email",
      namePath: "username",
      avatarPath: "avatar",
    },
  },
};

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o || {})[k], obj);
}

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

function generateState(): string {
  return base64URLEncode(crypto.randomBytes(16));
}

function generateNonce(): string {
  return base64URLEncode(crypto.randomBytes(16));
}

export interface OAuthBeginResult {
  redirectUrl: string;
  transactionId: string;
}

async function getAllowedRedirectUris(tenantId: string): Promise<string[]> {
  const result = await query(
    `SELECT allowed_redirect_uris FROM tenants WHERE id = $1`,
    [tenantId],
  );
  return result.rows[0]?.allowed_redirect_uris ?? [];
}

function validateRedirectUri(uri: string, allowed: string[]): void {
  // If tenant has no registered URIs, fall back to env var (no validation needed)
  if (allowed.length === 0) return;

  const parsed = new URL(uri);
  const isAllowed = allowed.some((allowedUri) => {
    try {
      const a = new URL(allowedUri);
      return (
        parsed.protocol === a.protocol &&
        parsed.host === a.host &&
        parsed.pathname.startsWith(a.pathname)
      );
    } catch {
      return false;
    }
  });

  if (!isAllowed) {
    throw new Error("redirect_uri_not_allowed");
  }
}

export class OAuthService {
  async getConnection(
    tenantId: string,
    providerKey: string,
  ): Promise<TenantOAuthConnection | null> {
    const result = await query(
      `SELECT * FROM tenant_oauth_connections 
       WHERE tenant_id = $1 AND provider_key = $2 AND enabled = true`,
      [tenantId, providerKey],
    );
    return result.rows[0] || null;
  }

  async listConnections(tenantId: string): Promise<TenantOAuthConnection[]> {
    const result = await query(
      `SELECT * FROM tenant_oauth_connections WHERE tenant_id = $1 ORDER BY provider_key`,
      [tenantId],
    );
    return result.rows;
  }

  async createConnection(
    tenantId: string,
    providerKey: string,
    clientId: string,
    clientSecret: string,
    options?: Partial<TenantOAuthConnection>,
  ): Promise<TenantOAuthConnection> {
    const preset = PROVIDER_PRESETS[providerKey] || {};
    const connection = {
      tenant_id: tenantId,
      provider_key: providerKey,
      client_id: clientId,
      client_secret_ciphertext: encrypt(clientSecret),
      scopes: options?.scopes ||
        preset.scopes || ["openid", "email", "profile"],
      claim_mapping: options?.claim_mapping ||
        preset.claim_mapping || { subjectPath: "sub" },
      issuer: options?.issuer || preset.issuer || null,
      authorization_endpoint:
        options?.authorization_endpoint ||
        preset.authorization_endpoint ||
        null,
      token_endpoint: options?.token_endpoint || preset.token_endpoint || null,
      userinfo_endpoint:
        options?.userinfo_endpoint || preset.userinfo_endpoint || null,
      jwks_uri: options?.jwks_uri || preset.jwks_uri || null,
    };

    const result = await query(
      `INSERT INTO tenant_oauth_connections 
       (tenant_id, provider_key, issuer, authorization_endpoint, token_endpoint, 
        userinfo_endpoint, jwks_uri, client_id, client_secret_ciphertext, scopes, claim_mapping)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        connection.tenant_id,
        connection.provider_key,
        connection.issuer,
        connection.authorization_endpoint,
        connection.token_endpoint,
        connection.userinfo_endpoint,
        connection.jwks_uri,
        connection.client_id,
        connection.client_secret_ciphertext,
        connection.scopes,
        JSON.stringify(connection.claim_mapping),
      ],
    );

    return result.rows[0];
  }

  async beginLogin(
    connectionId: string,
    tenantId: string,
    successRedirectUri?: string,
  ): Promise<OAuthBeginResult> {
    const connection = await query(
      `SELECT * FROM tenant_oauth_connections WHERE id = $1 AND tenant_id = $2`,
      [connectionId, tenantId],
    );

    if (!connection.rows[0]) {
      throw new Error("connection_not_found");
    }

    const conn = connection.rows[0];

    // Validate success_redirect_uri against tenant's allowed list
    const resolvedSuccessUri =
      successRedirectUri ?? process.env.OAUTH_SUCCESS_REDIRECT ?? null;
    if (resolvedSuccessUri) {
      const allowed = await getAllowedRedirectUris(tenantId);
      validateRedirectUri(resolvedSuccessUri, allowed);
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    const nonce = generateNonce();
    const callbackUri = `${CALLBACK_BASE}/oauth/callback/${conn.id}`;
    const transactionId = crypto.randomUUID();

    await query(
      `INSERT INTO oauth_transactions
       (id, connection_id, tenant_id, state, nonce, code_verifier, redirect_uri, success_redirect_uri, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '10 minutes')`,
      [
        transactionId,
        conn.id,
        tenantId,
        state,
        nonce,
        codeVerifier,
        callbackUri,
        resolvedSuccessUri,
      ],
    );

    const params = new URLSearchParams({
      client_id: conn.client_id,
      redirect_uri: callbackUri,
      response_type: "code",
      scope: conn.scopes.join(" "),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });

    const redirectUrl = `${conn.authorization_endpoint}?${params.toString()}`;

    return { redirectUrl, transactionId };
  }

  async handleCallback(connectionId: string, code: string, state: string) {
    const txResult = await query(
      `SELECT * FROM oauth_transactions WHERE state = $1 AND connection_id = $2`,
      [state, connectionId],
    );

    if (!txResult.rows[0]) {
      throw new Error("invalid_state");
    }

    const tx = txResult.rows[0];

    if (new Date(tx.expires_at) < new Date()) {
      throw new Error("transaction_expired");
    }

    const connResult = await query(
      `SELECT * FROM tenant_oauth_connections WHERE id = $1`,
      [connectionId],
    );

    const conn = connResult.rows[0];

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: conn.client_id,
      client_secret: decrypt(conn.client_secret_ciphertext),
      redirect_uri: `${CALLBACK_BASE}/oauth/callback/${conn.id}`,
      code_verifier: tx.code_verifier,
    });

    const tokenResponse = await fetch(conn.token_endpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`token_exchange_failed: ${errorText}`);
    }

    const tokens: any = await tokenResponse.json();

    let claims: any = {};
    let profile: any = {};

    if (tokens.id_token) {
      const parts = tokens.id_token.split(".");
      if (parts.length >= 2) {
        claims = JSON.parse(Buffer.from(parts[1], "base64").toString());
      }
    }

    if (conn.userinfo_endpoint) {
      try {
        const userInfoResponse = await fetch(conn.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userInfoResponse.ok) {
          profile = await userInfoResponse.json();
        }
      } catch (e) {
        console.error("userinfo fetch failed:", e);
      }
    }

    const mapping =
      typeof conn.claim_mapping === "string"
        ? JSON.parse(conn.claim_mapping)
        : conn.claim_mapping;

    const providerSubject = getNestedValue(
      claims,
      mapping.subjectPath || "sub",
    );
    const providerEmail = mapping.emailPath
      ? getNestedValue({ ...claims, ...profile }, mapping.emailPath)
      : null;

    if (!providerSubject) {
      throw new Error("missing_subject");
    }

    const identity = await this.findOrCreateIdentity(
      conn.tenant_id,
      conn.id,
      providerSubject,
      providerEmail,
      { ...claims, ...profile },
    );

    await this.storeTokens(identity.id, tokens);

    const successRedirectUri =
      tx.success_redirect_uri ?? process.env.OAUTH_SUCCESS_REDIRECT ?? null;

    await query(`DELETE FROM oauth_transactions WHERE id = $1`, [tx.id]);

    return { identity, tokens, successRedirectUri };
  }

  private async findOrCreateIdentity(
    tenantId: string,
    connectionId: string,
    providerSubject: string,
    providerEmail: string | null,
    profile: any,
  ): Promise<Identity> {
    const existingResult = await query(
      `SELECT * FROM identities 
       WHERE tenant_id = $1 AND connection_id = $2 AND provider_subject = $3`,
      [tenantId, connectionId, providerSubject],
    );

    if (existingResult.rows[0]) {
      await query(
        `UPDATE identities SET profile = $1, provider_email = $2 WHERE id = $3`,
        [JSON.stringify(profile), providerEmail, existingResult.rows[0].id],
      );
      return existingResult.rows[0];
    }

    const userResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, email_verified)
       VALUES ($1, $2, 'oauth', $3) RETURNING id`,
      [tenantId, providerEmail, providerEmail ? true : false],
    );

    const userId = userResult.rows[0].id;

    const identityResult = await query(
      `INSERT INTO identities (user_id, tenant_id, connection_id, provider_subject, provider_email, profile)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        userId,
        tenantId,
        connectionId,
        providerSubject,
        providerEmail,
        JSON.stringify(profile),
      ],
    );

    return identityResult.rows[0];
  }

  private async storeTokens(identityId: string, tokens: any): Promise<void> {
    const existingResult = await query(
      `SELECT id FROM oauth_tokens WHERE identity_id = $1 AND revoked_at IS NULL`,
      [identityId],
    );

    if (existingResult.rows.length > 0) {
      await query(
        `UPDATE oauth_tokens SET revoked_at = NOW() WHERE identity_id = $1`,
        [identityId],
      );
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await query(
      `INSERT INTO oauth_tokens 
       (identity_id, access_token_ciphertext, refresh_token_ciphertext, id_token_ciphertext, 
        scope, token_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        identityId,
        tokens.access_token ? encrypt(tokens.access_token) : null,
        tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokens.id_token ? encrypt(tokens.id_token) : null,
        tokens.scope,
        tokens.token_type,
        expiresAt,
      ],
    );
  }

  async getUserByIdentity(identity: Identity) {
    const result = await query(
      `SELECT id, email, email_verified, created_at FROM users WHERE id = $1`,
      [identity.user_id],
    );
    return result.rows[0];
  }
}

export const oauthService = new OAuthService();
