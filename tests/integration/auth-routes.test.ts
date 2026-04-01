import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getApp, teardownApp } from "../helpers/test-app";

describe("Auth Routes Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await teardownApp();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        headers: {
          "X-Tenant-ID": "tenant-integration-1",
        },
        body: {
          email: `test-${Date.now()}@example.com`,
          password: "password123",
        },
      });

      if (response.statusCode !== 200) {
        console.log("Register response:", response.statusCode, response.body);
      }
      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body).toHaveProperty("access_token");
      expect(body).toHaveProperty("refresh_token");
      expect(body.user).toMatchObject({
        email_verified: false,
      });
      expect(body.user).toHaveProperty("id");
    });

    it("should reject registration with missing tenant", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        headers: {},
        body: {
          email: "test@example.com",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should reject login for non-existent user", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        headers: {
          "X-Tenant-ID": "tenant-integration-1",
        },
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /health", () => {
    it("should return health status without tenant header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: "ok",
      });
    });
  });
});
