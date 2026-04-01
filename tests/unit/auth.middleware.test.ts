import { describe, it, expect } from "@jest/globals";
import { authenticateToken } from "../../src/middleware/auth";
import { FastifyRequest } from "fastify";

describe("Auth Middleware Unit Tests", () => {
  describe("authenticateToken", () => {
    it("should reject request when jwtVerify fails", async () => {
      const request = {
        headers: { authorization: "Bearer token" },
        jwtVerify: async () => {
          throw new Error("invalid token");
        },
      } as unknown as FastifyRequest;

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

      await authenticateToken(request, reply);

      expect(reply.statusCode).toBe(401);
      expect(reply.sent).toBe(true);
    });
  });
});
