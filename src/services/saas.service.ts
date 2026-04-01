import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { query, getClient } from "../config/database";
import { RegisterRequest, AuthResponse } from "../types/auth";

export class SaaSService {
  constructor(private fastify: FastifyInstance) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const client = await getClient();

    try {
      await client.query("BEGIN");

      // Check if user already exists with this email across all tenants
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [data.email],
      );

      if (existingUser.rows.length > 0) {
        throw new Error("USER_ALREADY_EXISTS");
      }

      // Create a new tenant for this user
      const tenantKey = data.email
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 50);
      const tenantName = data.email;

      const tenantResult = await client.query(
        `INSERT INTO tenants (name, key) 
         VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tenantName, tenantKey],
      );

      const tenantId = tenantResult.rows[0].id;

      // Create the user in this tenant
      const password_hash = await bcrypt.hash(data.password, 10);

      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, email_verified) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, email_verified, created_at, updated_at`,
        [tenantId, data.email, password_hash, false],
      );

      const user = userResult.rows[0];

      await client.query("COMMIT");

      return this.generateAuthResponse(user, tenantId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async loginOrRegisterWithGoogle(email: string): Promise<AuthResponse> {
    const client = await getClient();

    try {
      await client.query("BEGIN");

      // Find existing user by email
      const existingUser = await client.query(
        "SELECT id, tenant_id, email, email_verified FROM users WHERE email = $1",
        [email],
      );

      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        await client.query("COMMIT");
        return this.generateAuthResponse(user, user.tenant_id);
      }

      // New user — create tenant + user automatically
      const tenantKey = email
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 50);

      const tenantResult = await client.query(
        `INSERT INTO tenants (name, key)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [email, tenantKey],
      );

      const tenantId = tenantResult.rows[0].id;

      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, email_verified)
         VALUES ($1, $2, 'oauth_google', true)
         RETURNING id, email, email_verified, created_at, updated_at`,
        [tenantId, email],
      );

      const user = userResult.rows[0];
      await client.query("COMMIT");

      return this.generateAuthResponse(user, tenantId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const result = await query(
      `SELECT u.id, u.tenant_id, u.email, u.password_hash, u.email_verified 
       FROM users u
       WHERE u.email = $1`,
      [data.email],
    );

    if (result.rows.length === 0) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return this.generateAuthResponse(user, user.tenant_id);
  }

  private generateAuthResponse(user: any, tenantId: string): AuthResponse {
    const access_token = this.generateAccessToken(user, tenantId);
    const refresh_token = this.generateRefreshToken(user, tenantId);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
    };
  }

  private generateAccessToken(user: any, tenantId: string): string {
    const payload = {
      sub: user.id,
      tenant: tenantId,
      email: user.email,
      email_verified: user.email_verified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    return this.fastify.jwt.sign(payload);
  }

  private generateRefreshToken(user: any, tenantId: string): string {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    query(
      `INSERT INTO sessions (tenant_id, user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, user.id, token, expiresAt],
    );

    return token;
  }
}
