import { tenantMiddleware, verifyTenantMatch } from '../../src/middleware/tenant';
import { FastifyRequest } from 'fastify';

const createMockRequest = (
  headers?: any,
  user?: any,
  tenantId?: string
): Partial<FastifyRequest> => ({
  headers: headers || {},
  user: user,
  tenantId: tenantId,
});

const createMockReply = (): any => {
  const reply: any = {
    statusCode: null,
    sent: false,
    payload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: any) {
      this.sent = true;
      this.payload = payload;
      return this;
    },
  };
  return reply;
};

describe('Tenant Middleware Unit Tests', () => {
  describe('tenantMiddleware', () => {
    it('should reject request without X-Tenant-ID header', async () => {
      const request = createMockRequest({});
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(400);
      expect(reply.sent).toBe(true);
      expect(reply.payload).toMatchObject({
        error: 'missing_tenant_header',
        message: 'X-Tenant-ID header is required',
      });
    });

    it('should reject request with empty X-Tenant-ID header', async () => {
      const request = createMockRequest({
        'x-tenant-id': '',
      });
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(400);
    });

    it('should accept request with valid X-Tenant-ID header', async () => {
      const request = createMockRequest({
        'x-tenant-id': 'tenant-123',
      });
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      // Should not send response (middleware passed)
      expect(reply.sent).toBe(false);
      expect(request.tenantId).toBe('tenant-123');
    });

    it('should handle case-sensitive header names (lowercase)', async () => {
      const request = createMockRequest({
        'x-tenant-id': 'tenant-abc',
      });
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      expect(reply.sent).toBe(false);
      expect(request.tenantId).toBe('tenant-abc');
    });

    it('should accept tenant IDs with special characters', async () => {
      const specialTenantIds = [
        'tenant_123',
        'tenant-abc-123',
        'TenantWithCaps',
        'tenant.with.dots',
        '12345',
      ];

      for (const tenantId of specialTenantIds) {
        const request = createMockRequest({
          'x-tenant-id': tenantId,
        });
        const reply = createMockReply();

        await tenantMiddleware(request as FastifyRequest, reply as any);

        expect(reply.sent).toBe(false);
        expect(request.tenantId).toBe(tenantId);
      }
    });

    it('should handle very long tenant IDs', async () => {
      const longTenantId = 'a'.repeat(1000);
      const request = createMockRequest({
        'x-tenant-id': longTenantId,
      });
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      expect(reply.sent).toBe(false);
      expect(request.tenantId).toBe(longTenantId);
    });

    it('should handle tenant ID with whitespace', async () => {
      const request = createMockRequest({
        'x-tenant-id': '  tenant-with-spaces  ',
      });
      const reply = createMockReply();

      await tenantMiddleware(request as FastifyRequest, reply as any);

      // Should preserve whitespace (validation could be added later if needed)
      expect(reply.sent).toBe(false);
      expect(request.tenantId).toBe('  tenant-with-spaces  ');
    });
  });

  describe('verifyTenantMatch', () => {
    it('should pass when JWT tenant matches header tenant', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'tenant-123',
        },
        { tenant: 'tenant-123' },
        'tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.sent).toBe(false);
    });

    it('should reject when JWT tenant does not match header tenant', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'tenant-123',
        },
        { tenant: 'tenant-456' }, // Different tenant in JWT
        'tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(403);
      expect(reply.payload).toMatchObject({
        error: 'tenant_mismatch',
        message: 'JWT tenant does not match request tenant',
      });
    });

    it('should reject when JWT has no tenant claim', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'tenant-123',
        },
        { email: 'user@example.com' }, // No tenant in JWT
        'tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(403);
      expect(reply.payload).toMatchObject({
        error: 'tenant_mismatch',
      });
    });

    it('should reject when JWT tenant is undefined', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'tenant-123',
        },
        { tenant: undefined },
        'tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(403);
    });

    it('should handle null tenant in JWT', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'tenant-123',
        },
        { tenant: null },
        'tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(403);
    });

    it('should be case-sensitive for tenant comparison', async () => {
      const request = createMockRequest(
        {
          'x-tenant-id': 'Tenant-123',
        },
        { tenant: 'tenant-123' }, // Different case
        'Tenant-123'
      );
      const reply = createMockReply();

      await verifyTenantMatch(request as FastifyRequest, reply as any);

      expect(reply.statusCode).toBe(403);
    });
  });
});
