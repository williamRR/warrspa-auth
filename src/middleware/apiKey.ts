import crypto from "crypto";
import { query } from "../config/database";

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  prefix: string;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

export async function validateApiKey(apiKey: string): Promise<ApiKey | null> {
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const result = await query(
    `SELECT ak.id, ak.tenant_id, ak.name, ak.prefix, ak.last_used_at, ak.expires_at, ak.created_at
     FROM api_keys ak
     WHERE ak.key_hash = $1 AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
    [keyHash],
  );

  if (result.rows.length === 0) {
    return null;
  }

  await query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", [
    result.rows[0].id,
  ]);

  return result.rows[0];
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function generateApiKey(): string {
  const prefix = "wsp_" + crypto.randomBytes(4).toString("hex");
  const randomPart = crypto.randomBytes(24).toString("base64url");
  return prefix + randomPart;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 10);
}
