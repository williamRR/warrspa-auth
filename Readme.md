# 🔐 Auth Platform — Multi-Tenant, Cloud-Ready, Production Mindset

Sistema de autenticación y gestión de identidad inspirado en Supabase Auth.
Enfocado en demostrar diseño seguro, arquitectura cloud, multi-tenant real y buenas prácticas productivas.
Tenant aislado mediante **header obligatorio `X-Tenant-ID`**.

---

## 🚀 Quick Start

```bash
# Levantar PostgreSQL
docker-compose up -d postgres

# Iniciar servidor
npm run dev
```

### Probar endpoints

```bash
# 1. Crear tenant en la DB
docker exec auth_warrspa_db psql -U auth_user -d auth_warrspa \
  -c "INSERT INTO tenants (id, name, key) VALUES (uuid_generate_v4(), 'Mi App', 'mi-app') RETURNING id;"

# 2. Registrar usuario
TENANT_ID="<uuid-del-tenant>"
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"email":"test@example.com","password":"password123"}'

# 4. Obtener usuario actual
curl http://localhost:3000/auth/me \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer <access_token>"
```

---

## 🎯 Objetivo

Proveer:

- Registro, login, tokens seguros, refresh y logout.
- Recuperación de contraseña y verificación de email.
- RBAC básico.
- Multi-tenancy robusto.
- Observabilidad, auditoría y despliegue realista en GCP.
- SDK para integración simple.

Sirve como **producto demostrativo profesional**, no como servicio comercial.

---

## 🧩 Arquitectura

- **Runtime:** Node.js / Go (a definir)
- **API:** REST
- **Auth:** JWT Access + Refresh tokens rotables
- **Hash:** Argon2 o bcrypt
- **DB:** PostgreSQL
- **Infra:** GCP + Terraform
- **Despliegue:** Cloud Run
- **Secrets:** Google Secret Manager
- **Email:** proveedor externo + envío async
- **CI/CD:** GitHub Actions

---

## 🏷️ Multi-Tenancy

### Cómo se identifica el tenant

Cada request debe incluir:

```
X-Tenant-ID: <tenant_key>
```

### Enforcement

1. Middleware resuelve tenant.
2. El JWT debe contener el mismo tenant.
3. Si no coincide → `403 tenant_mismatch`.
4. Todas las consultas a la BD filtran por tenant.
5. Roles, sesiones y policies scoped por tenant.

### Modelo recomendado

Single DB con `tenant_id` en tablas:

- users
- sessions
- roles
- audit_logs

Índices e integridad:

- `unique(email, tenant_id)`
- `tenant_id NOT NULL`
- index por `tenant_id`

---

## 🧪 Tokens

- Access: corto (≈15m)
- Refresh: largo (≈15–30 días)
- Rotación segura + revocación
- Claims:

```
sub
tenant
roles
email
email_verified
iat
exp
```

---

## 📡 Endpoints

### Auth básico

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

### Password lifecycle

- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`

### Email verification

- `POST /auth/email/send-verification`
- `POST /auth/email/verify`

### Roles

- `GET /roles`
- `POST /roles`
- `POST /users/:id/roles/assign`
- `POST /users/:id/roles/remove`

### Sessions seguridad

- `GET /auth/sessions`
- `DELETE /auth/sessions/:id`

### Admin

- `GET /admin/users`
- `GET /admin/audit`
- `GET /admin/stats`

---

## 🔒 Seguridad

- Hash Argon2 o bcrypt
- JWT firmado
- Refresh con rotación
- Revocation list
- Email verification
- Rate limit
- Audit log
- Validación estricta tenant
- Nunca confiar en tenant enviado sin validar contra token

---

## ☁️ Infraestructura (low-cost GCP)

- Cloud Run
- Cloud SQL Postgres (tier bajo)
- Secret Manager
- Cloud Tasks para emails
- Terraform:
  - VPC
  - permisos mínimos IAM
  - state remoto y lock

---

## 📈 Roadmap

### Fase 1 — MVP

- register, login, refresh, logout, me
- JWT + refresh
- Tenant en header
- Terraform + CI/CD
- Demo pública

### Fase 2 — Seguridad real

- verify email
- forgot/reset password
- refresh rotation
- audit logs
- sesiones

### Fase 3 — Enterprise feeling

- RBAC
- roles
- policies simples
- rate limit
- tenant admin
- métricas

### Fase 4 — Integración y valor CV

- SDK JS/TS
- app de ejemplo
- Postman collection
- diagrama arquitectura
- benchmarks
- comparación vs Firebase

### Extras opcionales

- Magic links
- Social login
- MFA TOTP
- webhooks
- panel admin

---

## ✅ Resultado esperado

Esto demuestra:

- arquitectura cloud
- seguridad real
- diseño multi-tenant correcto
- pensamiento de producto
- madurez técnica
