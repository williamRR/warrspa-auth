import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { query } from "../config/database";
import {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  JwtPayload,
} from "../types/auth";

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(
    tenantId: string,
    data: RegisterRequest,
  ): Promise<AuthResponse> {
    const existingUser = await query(
      "SELECT id FROM users WHERE tenant_id = $1 AND email = $2",
      [tenantId, data.email],
    );

    if (existingUser.rows.length > 0) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const result = await query(
      `INSERT INTO users (tenant_id, email, password_hash, email_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, email_verified, created_at, updated_at`,
      [tenantId, data.email, password_hash, false],
    );

    const user = result.rows[0];
    return this.generateAuthResponse(user, tenantId);
  }

  async login(tenantId: string, data: LoginRequest): Promise<AuthResponse> {
    const result = await query(
      `SELECT id, tenant_id, email, password_hash, email_verified 
       FROM users WHERE tenant_id = $1 AND email = $2`,
      [tenantId, data.email],
    );

    if (result.rows.length === 0) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return this.generateAuthResponse(user, tenantId);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const result = await query(
      `SELECT s.user_id, s.tenant_id, s.expires_at, u.id, u.email, u.email_verified
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token = $1 AND s.revoked_at IS NULL`,
      [refreshToken],
    );

    if (result.rows.length === 0) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const session = result.rows[0];

    if (new Date(session.expires_at) < new Date()) {
      await query(
        "UPDATE sessions SET revoked_at = NOW() WHERE refresh_token = $1",
        [refreshToken],
      );
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    await query(
      "UPDATE sessions SET revoked_at = NOW() WHERE refresh_token = $1",
      [refreshToken],
    );

    return this.generateAuthResponse(session, session.tenant_id);
  }

  async logout(refreshToken: string): Promise<void> {
    await query(
      "UPDATE sessions SET revoked_at = NOW() WHERE refresh_token = $1",
      [refreshToken],
    );
  }

  async getUserById(userId: string): Promise<any | null> {
    const result = await query(
      `SELECT u.id, u.email, u.email_verified, u.tenant_id, u.created_at,
              i.profile as identity_profile, c.claim_mapping
       FROM users u
       LEFT JOIN identities i ON i.user_id = u.id
       LEFT JOIN tenant_oauth_connections c ON c.id = i.connection_id
       WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const user_metadata: any = {};

    if (row.identity_profile && row.claim_mapping) {
      const profile = row.identity_profile;
      const mapping = row.claim_mapping;

      if (mapping.namePath) {
        user_metadata.full_name = this.getNestedValue(
          profile,
          mapping.namePath,
        );
      }
      if (mapping.avatarPath) {
        user_metadata.avatar_url = this.getNestedValue(
          profile,
          mapping.avatarPath,
        );
      }
    }

    return {
      id: row.id,
      email: row.email,
      email_verified: row.email_verified,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      user_metadata,
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((o, k) => (o || {})[k], obj);
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
    const payload: JwtPayload = {
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
