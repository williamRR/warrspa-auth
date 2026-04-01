# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant authentication platform inspired by Supabase Auth. This is a production-demo showcasing secure design, cloud architecture, real multi-tenancy, and enterprise-grade practices. The project is in early planning stages.

**Important:** This serves as a professional demo product, not a commercial service.

## Multi-Tenancy Architecture

The system enforces tenant isolation through a mandatory `X-Tenant-ID` header on every request.

**Critical security enforcement:**
1. Middleware resolves tenant from the header
2. JWT must contain the same tenant identifier
3. Mismatch between header and JWT → `403 tenant_mismatch`
4. All database queries filter by `tenant_id`
5. Never trust tenant sent without validating against JWT

**Database model:** Single PostgreSQL with `tenant_id` on all tables (users, sessions, roles, audit_logs). Constraints:
- `unique(email, tenant_id)`
- `tenant_id NOT NULL`
- Indexed on `tenant_id`

## Authentication Design

**Token strategy:**
- Access tokens: ~15 minutes expiration
- Refresh tokens: ~15-30 days expiration
- Refresh token rotation + revocation list
- JWT claims: `sub`, `tenant`, `roles`, `email`, `email_verified`, `iat`, `exp`

**Hashing:** Argon2 or bcrypt for passwords

## Tech Stack

**Implemented:**
- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL
- **Testing:** Jest (unit/integration), Playwright (E2E), Pact (contract tests)
- **CI/CD:** GitHub Actions with full test pipeline

**To Be Implemented:**
- **Infrastructure:** GCP (Cloud Run, Cloud SQL, Secret Manager, Cloud Tasks)
- **IaC:** Terraform
- **Email:** External provider with async delivery

## API Endpoints (Planned)

**Auth basic:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

**Password lifecycle:**
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`

**Email verification:**
- `POST /auth/email/send-verification`
- `POST /auth/email/verify`

**Sessions:**
- `GET /auth/sessions`
- `DELETE /auth/sessions/:id`

**Roles (RBAC):**
- `GET /roles`
- `POST /roles`
- `POST /users/:id/roles/assign`
- `POST /users/:id/roles/remove`

**Admin:**
- `GET /admin/users`
- `GET /admin/audit`
- `GET /admin/stats`

## Security Requirements

- Hash passwords with Argon2 or bcrypt
- JWT signed with proper secrets
- Refresh token rotation on every use
- Email verification required
- Rate limiting on all endpoints
- Comprehensive audit logging
- Strict tenant validation in all code paths

## Testing

This project has comprehensive testing infrastructure. See [TESTING.md](./TESTING.md) for detailed documentation.

**Quick commands:**
- `npm test` - Run all Jest tests (unit + integration + contract)
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:coverage` - Generate coverage report (requires 80% minimum coverage)
- `npm run test:watch` - Watch mode for development

**Test structure:**
- `tests/unit/` - Unit tests for individual functions
- `tests/integration/` - API integration tests
- `tests/e2e/` - End-to-end tests with Playwright
- `tests/contract/` - Pact contract tests
- `tests/fixtures/` - Test data factories
- `tests/helpers/` - Test utilities

**Coverage requirements:** Minimum 80% across branches, functions, lines, and statements.

## Project Roadmap

**Phase 1 — MVP:** register, login, refresh, logout, me, JWT+refresh, tenant header, Terraform, CI/CD

**Phase 2 — Security:** verify email, forgot/reset password, refresh rotation, audit logs, sessions

**Phase 3 — Enterprise:** RBAC, roles, policies, rate limit, tenant admin, metrics

**Phase 4 — Integration:** JS/TS SDK, example app, Postman collection, architecture diagrams, benchmarks
