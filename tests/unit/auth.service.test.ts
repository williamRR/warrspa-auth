import { describe, it, expect, beforeEach } from "@jest/globals";
import { FastifyInstance } from "fastify";
import { AuthService } from "../../src/services/auth.service";

describe("AuthService Unit Tests", () => {
  let fastify: FastifyInstance;
  let authService: AuthService;

  beforeEach(async () => {
    fastify = {
      jwt: {
        sign: jest.fn().mockImplementation((payload) => {
          const header = Buffer.from(
            JSON.stringify({ alg: "HS256", typ: "JWT" }),
          ).toString("base64");
          const body = Buffer.from(JSON.stringify(payload)).toString("base64");
          const signature = Buffer.from("mock-signature").toString("base64");
          return `${header}.${body}.${signature}`;
        }),
      },
    } as unknown as FastifyInstance;

    authService = new AuthService(fastify);
  });

  describe("register", () => {
    it("should be defined", () => {
      expect(authService).toBeDefined();
    });
  });
});
