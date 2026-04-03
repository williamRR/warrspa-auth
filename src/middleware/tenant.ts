import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
  }
}

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const tenantId = request.headers["x-tenant-id"] as string;

  if (!tenantId) {
    return reply.status(400).send({
      error: "missing_tenant_header",
      message: "X-Tenant-ID header is required",
    });
  }

  // Attach tenant to request for use in route handlers
  request.tenantId = tenantId;
}

export async function verifyTenantMatch(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const jwtTenant = (request.user as any)?.tenant;
  const headerTenant = request.tenantId;

  if (!jwtTenant || jwtTenant !== headerTenant) {
    return reply.status(403).send({
      error: "tenant_mismatch",
      message: "JWT tenant does not match request tenant",
    });
  }
}
