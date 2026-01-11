# APPCHULA MVP Implementation Plan

## Overview

Este documento define el plan de implementación del MVP de APPCHULA dividido en sesiones ejecutables por agentes.

## MVP Scope (from projectSpec.md)

| Feature | Descripción |
|---------|-------------|
| Autenticación | Login email/password con invitación controlada |
| Dashboard Cliente | Resumen financiero, evolución balance, histórico rendimientos |
| Backoffice Usuarios | CRUD de usuarios, asignación de tipos y roles |
| Gestión Capital | Registro de capital inicial e incrementos |
| Cierre Mensual | Proceso de aplicación de rendimientos con validación |
| Retiros básicos | Solicitud y gestión de retiros en ventanas |
| Logs | Registro de todas las acciones críticas |

---

## Session Dependency Graph

```
[01-project-setup]
        │
        ▼
[02-database-schema]
        │
        ▼
[03-auth-system] ──────────────────┐
        │                          │
        ▼                          ▼
[04-backoffice-users]      [05-client-dashboard]
        │                          │
        ▼                          │
[06-capital-management] ◄──────────┘
        │
        ▼
[07-monthly-yields]
        │
        ▼
[08-withdrawals]
        │
        ▼
[09-audit-logs]
        │
        ▼
[10-integration-testing]
```

---

## Sessions Summary

| Session | Name | Agent Type | Dependencies |
|---------|------|------------|--------------|
| 01 | Project Setup | `setup-agent` | None |
| 02 | Database Schema | `database-agent` | 01 |
| 03 | Auth System | `auth-agent` | 02 |
| 04 | Backoffice Users | `fullstack-agent` | 03 |
| 05 | Client Dashboard | `frontend-agent` | 03 |
| 06 | Capital Management | `fullstack-agent` | 04, 05 |
| 07 | Monthly Yields | `fullstack-agent` | 06 |
| 08 | Withdrawals | `fullstack-agent` | 07 |
| 09 | Audit Logs | `backend-agent` | 08 |
| 10 | Integration & Testing | `qa-agent` | 09 |

---

## Agent Types Required

### `setup-agent`
- Inicialización de proyectos
- Configuración de herramientas
- Instalación de dependencias

### `database-agent`
- Diseño de schemas
- Creación de migraciones
- RLS policies
- Seeds de datos

### `auth-agent`
- Implementación de autenticación
- Middleware de protección
- Flujos de invitación/activación

### `fullstack-agent`
- Server Actions
- Componentes UI
- Integración frontend-backend

### `frontend-agent`
- Componentes React
- Layouts y páginas
- Estilos y UX

### `backend-agent`
- Lógica de negocio
- Edge Functions
- Integraciones

### `qa-agent`
- Tests E2E
- Tests unitarios
- Validación de requisitos

---

## Execution Order

1. Execute sessions sequentially (01 → 10)
2. Each session should be fully completed before starting the next
3. Run `npm run build` after each session to validate no breaking changes
4. Commit after each successful session

---

## Files Created Per Session

See individual session files for detailed file lists:
- `01-project-setup.md`
- `02-database-schema.md`
- `03-auth-system.md`
- `04-backoffice-users.md`
- `05-client-dashboard.md`
- `06-capital-management.md`
- `07-monthly-yields.md`
- `08-withdrawals.md`
- `09-audit-logs.md`
- `10-integration-testing.md`
