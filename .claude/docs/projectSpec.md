# APPCHULA - Project Specification

## 1. Product Requirements

### 1.1 Product Overview

APPCHULA es una plataforma privada de gestión y visualización de capital institucional diseñada para operar en un entorno de bajo volumen de usuarios y alto valor económico por cliente.

**Propósito**: Proporcionar una capa de visibilidad y control sobre inversiones que se gestionan principalmente fuera de la plataforma. No pretende reemplazar procesos financieros, contractuales o de compliance.

**Usuarios objetivo**:
- Family Offices
- Venture Capital
- Empresas patrimoniales
- Inversores institucionales
- Personas físicas de alto patrimonio (excepcional)

**Requisito de acceso**: Todos los clientes deben ser previamente cualificados comercialmente, validados por compliance y aceptados internamente antes de acceder a la plataforma.

### 1.2 Goals and Success Criteria

**Objetivos principales**:
- Proporcionar al cliente una visión clara y actualizada de su capital y balance
- Reflejar de forma transparente la evolución de los rendimientos a lo largo del tiempo
- Servir como herramienta interna de control, trazabilidad y gestión administrativa

**KPIs**:
- Tiempo de carga del dashboard < 2 segundos
- 100% de operaciones financieras auditables
- Zero errores en cálculos de rendimientos y comisiones
- Disponibilidad del sistema > 99.5%

### 1.3 In Scope / Out of Scope

**In Scope**:
- Dashboard de visualización para clientes
- Sistema de gestión de retiros con ventanas trimestrales
- Backoffice completo para administración
- Cálculo y gestión de rendimientos mensuales
- Sistema de comisiones para Agentes y Super Agentes
- Autenticación con 2FA
- Logs y auditoría completa
- Notificaciones por email
- Exportación de datos (CSV/Excel)
- Preparación para integración futura de KYC/KYB (Sumsub)

**Out of Scope**:
- Procesamiento de pagos/transferencias bancarias
- Depósitos dentro de la plataforma
- Registro público o autoservicio
- Aplicación móvil nativa
- Multi-moneda (solo USD)
- Trading o inversión directa
- Integración con sistemas externos de contabilidad

---

## 2. Product Roadmap

### 2.1 Milestones Overview

1. **MVP**: Core funcional con dashboard, backoffice básico y gestión de rendimientos
2. **V1.1**: Sistema completo de comisiones y retiros
3. **V1.2**: Notificaciones, exportaciones y mejoras UX
4. **V2.0**: Integración KYC/KYB y 2FA avanzado

### 2.2 MVP Definition

El MVP incluye las funcionalidades mínimas para operar la plataforma con clientes reales.

**Core Features**:

| Feature | Descripción |
|---------|-------------|
| Autenticación | Login email/password con invitación controlada |
| Dashboard Cliente | Resumen financiero, evolución balance, histórico rendimientos |
| Backoffice Usuarios | CRUD de usuarios, asignación de tipos y roles |
| Gestión Capital | Registro de capital inicial e incrementos |
| Cierre Mensual | Proceso de aplicación de rendimientos con validación |
| Retiros básicos | Solicitud y gestión de retiros en ventanas |
| Logs | Registro de todas las acciones críticas |

**MVP Limitations**:
- Sin 2FA (solo email/password)
- Sin notificaciones automáticas por email
- Sin exportación de datos
- Sin sistema de comisiones completo
- KYC/KYB no funcional (solo campos preparados)

### 2.3 Future Versions

**V1.1 - Comisiones y Retiros Completos**:
- Sistema completo de comisiones para Agentes
- Sistema completo de comisiones para Super Agentes
- Flujo completo de retiros con todos los estados
- Validaciones de antigüedad y ventanas

**V1.2 - Notificaciones y Exportación**:
- Notificaciones automáticas por email
- Exportación CSV/Excel de históricos
- Mejoras de UX en dashboard
- Notas internas en perfiles

**V2.0 - KYC/KYB y Seguridad Avanzada**:
- Integración con Sumsub para KYC/KYB
- 2FA con Authenticator App
- Recordar dispositivo por 30 días
- Estados de usuario no verificado funcionales

---

## 3. Technical Specification

### 3.1 Tech Stack

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 14+ (App Router) |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts o Chart.js |
| Email | Resend |
| Hosting | Vercel |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage (si necesario) |

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────┤
│  Client Dashboard  │  Backoffice  │  Auth Pages             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER ACTIONS                           │
│              (Next.js Server Components)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│     Auth     │   Database   │    Edge      │    Storage     │
│              │  PostgreSQL  │  Functions   │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│        Resend (Email)        │     Sumsub (KYC - futuro)    │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── activate/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard principal
│   │   ├── rendimientos/
│   │   ├── retiros/
│   │   └── perfil/
│   ├── (backoffice)/
│   │   ├── layout.tsx
│   │   ├── usuarios/
│   │   ├── cierre-mensual/
│   │   ├── retiros/
│   │   ├── comisiones/
│   │   └── logs/
│   ├── api/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── dashboard/
│   ├── backoffice/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── actions/
│   │   ├── users.ts
│   │   ├── capital.ts
│   │   ├── rendimientos.ts
│   │   ├── retiros.ts
│   │   └── comisiones.ts
│   ├── utils/
│   └── validations/
├── types/
│   └── index.ts
├── hooks/
├── middleware.ts
└── supabase/
    ├── migrations/
    └── seed.sql
```

### 3.4 Data Flow

**Flujo de Cierre Mensual**:
1. Administrador accede a Backoffice → Cierre Mensual
2. Introduce porcentaje de rendimiento del mes
3. Server Action calcula rendimientos para cada cliente elegible
4. Se presenta listado de validación con checkboxes
5. Administrador revisa y aprueba/excluye clientes
6. Server Action ejecuta el cierre:
   - Actualiza balances
   - Genera registros históricos
   - Registra log de auditoría
7. Dashboard de clientes refleja nuevos valores

**Flujo de Retiro**:
1. Cliente accede a Dashboard → Retiros
2. Sistema valida ventana activa y antigüedad
3. Cliente crea solicitud de retiro
4. Server Action guarda solicitud con estado "Solicitado"
5. Administrador ve solicitud en Backoffice
6. Administrador aprueba → estado "Aprobado"
7. Administrador ejecuta (pago externo) → estado "Ejecutado"
8. Server Action descuenta del balance

### 3.5 Database Schema

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('cliente', 'agente', 'super_agente')),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'no_verificado', 'bloqueado')),

  -- Relaciones comerciales
  agent_id UUID REFERENCES users(id),
  super_agent_id UUID REFERENCES users(id),

  -- Roles operativos
  is_admin BOOLEAN DEFAULT FALSE,
  is_operator BOOLEAN DEFAULT FALSE,

  -- KYC (preparación futura)
  kyc_status TEXT DEFAULT 'pending',
  kyc_provider TEXT,
  kyc_verified_at TIMESTAMPTZ,

  -- Datos financieros
  initial_capital DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  guaranteed_percentage DECIMAL(5,2) CHECK (guaranteed_percentage IN (2.5, 3.25, 4.25, 5.0)),
  yield_start_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);
```

#### capital_movements
```sql
CREATE TABLE capital_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('deposito_inicial', 'incremento', 'retiro', 'comision_entrada', 'comision_salida')),
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  executed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### monthly_yields
```sql
CREATE TABLE monthly_yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  percentage_applied DECIMAL(5,2) NOT NULL,
  yield_amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  is_proportional BOOLEAN DEFAULT FALSE,
  executed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);
```

#### monthly_closures
```sql
CREATE TABLE monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  percentage DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'executed')),
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);
```

#### withdrawals
```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('parcial', 'total')),
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprobado', 'ejecutado', 'rechazado')),
  withdrawal_window DATE NOT NULL,

  -- Tracking
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES users(id),

  notes TEXT
);
```

#### commissions
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  source_user_id UUID NOT NULL REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  base_amount DECIMAL(15,2) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'acreditada')),
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### invitations
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### internal_notes
```sql
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 Authentication & Authorization

**Estrategia de Auth**:
- Supabase Auth con email/password
- Sin registro público (solo invitación)
- Token de activación con caducidad de 24h
- Sesión con timeout de 20 minutos de inactividad

**Roles y Permisos**:

| Acción | Cliente | Agente | Super Agente | Operador | Admin |
|--------|---------|--------|--------------|----------|-------|
| Ver dashboard propio | ✓ | ✓ | ✓ | - | - |
| Ver clientes asociados | - | ✓ | ✓ | - | - |
| Solicitar retiro | ✓ | ✓ | ✓ | - | - |
| Acceso Backoffice | - | - | - | ✓ | ✓ |
| Ver info financiera (BO) | - | - | - | ✓ | ✓ |
| Crear usuarios | - | - | - | - | ✓ |
| Editar datos financieros | - | - | - | - | ✓ |
| Ejecutar cierre mensual | - | - | - | - | ✓ |
| Aprobar/ejecutar retiros | - | - | - | - | ✓ |
| Bloquear usuarios | - | - | - | - | ✓ |
| Añadir notas internas | - | - | - | ✓ | ✓ |

**Protección de Rutas**:
```typescript
// middleware.ts
- /dashboard/* → requiere auth + (cliente | agente | super_agente)
- /backoffice/* → requiere auth + (is_admin | is_operator)
- /api/admin/* → requiere auth + is_admin
```

### 3.7 API Design

**Server Actions principales**:

```typescript
// users.ts
createUser(data: CreateUserInput): Promise<User>
updateUser(id: string, data: UpdateUserInput): Promise<User>
blockUser(id: string): Promise<void>
unblockUser(id: string): Promise<void>
sendInvitation(userId: string): Promise<void>
resendInvitation(userId: string): Promise<void>

// capital.ts
addCapital(userId: string, amount: number): Promise<void>
adjustBalance(userId: string, amount: number, reason: string): Promise<void>

// rendimientos.ts
calculateMonthlyYields(year: number, month: number, percentage: number): Promise<YieldPreview[]>
executeMonthlyClose(year: number, month: number, approvedUserIds: string[]): Promise<void>

// retiros.ts
createWithdrawalRequest(userId: string, amount: number, type: 'parcial' | 'total'): Promise<Withdrawal>
approveWithdrawal(withdrawalId: string): Promise<void>
executeWithdrawal(withdrawalId: string): Promise<void>
rejectWithdrawal(withdrawalId: string, reason: string): Promise<void>

// comisiones.ts
calculateCommissions(year: number, month: number): Promise<CommissionPreview[]>
creditSuperAgentCommissions(year: number, month: number): Promise<void>
creditAgentCommissions(quarter: number, year: number): Promise<void>
```

**Error Handling**:
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

// Códigos de error
- INVALID_WITHDRAWAL_WINDOW
- INSUFFICIENT_SENIORITY
- INSUFFICIENT_BALANCE
- USER_BLOCKED
- CAPITAL_BELOW_MINIMUM
- CLOSURE_ALREADY_EXECUTED
```

### 3.8 Non-Functional Requirements

**Performance**:
- Tiempo de carga inicial < 3s
- Tiempo de respuesta de Server Actions < 500ms
- Soporte para hasta 500 usuarios concurrentes

**Security**:
- HTTPS obligatorio
- Tokens JWT con expiración
- Rate limiting en endpoints sensibles
- Sanitización de inputs
- RLS (Row Level Security) en todas las tablas
- Logs inmutables de auditoría

**Scalability**:
- Arquitectura stateless
- Database connection pooling via Supabase
- CDN para assets estáticos (Vercel)

**Maintainability**:
- TypeScript estricto
- Tests unitarios para lógica de negocio crítica
- Migraciones versionadas
- Documentación de API

### 3.9 Assumptions & Open Questions

**Assumptions**:
- Los usuarios no requieren verificación de identidad en MVP (KYC externo)
- El volumen de usuarios será < 1000 en el primer año
- Los administradores tienen conocimiento técnico básico
- Los emails transaccionales se envían en español
- La zona horaria de referencia es UTC para todos los cálculos

**Open Questions**:
- ¿Cuál es el proceso exacto si un retiro es rechazado?
- ¿Puede un Super Agente ser también Cliente simultáneamente?
- ¿Cuál es el formato exacto de las notificaciones por email?
- ¿Se requiere soporte multi-idioma en el futuro?
- ¿Cuáles son los valores exactos de RPO y RTO para backups?

---

## 4. Business Rules Reference

### 4.1 Rendimientos

| Regla | Descripción |
|-------|-------------|
| Umbral mínimo | Capital < 50,000 USD no genera rendimientos |
| Fecha ingreso ≤ 14 | Genera rendimiento desde el 15 del mismo mes (50% proporcional) |
| Fecha ingreso > 14 | Genera rendimiento desde el 1 del mes siguiente |
| Porcentaje garantizado | Se aplica si es mayor al porcentaje mensual |
| Valores permitidos | 2.5%, 3.25%, 4.25%, 5% |

### 4.2 Retiros

| Regla | Descripción |
|-------|-------------|
| Ventanas | 31 marzo, 30 junio, 30 sept, 31 dic |
| Antelación | Mínimo 10 días naturales antes de la ventana |
| Antigüedad | Mínimo 3 meses desde inicio de rendimientos |
| Cuenta destino | Misma cuenta del depósito inicial |
| Retiro total | Último mes con porcentaje mínimo garantizado |

### 4.3 Comisiones

| Tipo | Base de cálculo | Periodicidad | Acreditación |
|------|-----------------|--------------|--------------|
| Super Agente | Balance cliente (mes anterior) | Mensual | Inmediata al balance |
| Agente | Balance cliente post-retiro | Mensual (cálculo) | Trimestral (ventanas) |

### 4.4 Estados de Usuario

| Estado | Login | Visualizar | Operar | Rendimientos |
|--------|-------|------------|--------|--------------|
| Activo | ✓ | ✓ | ✓ | ✓ |
| No verificado | ✓ | ✓ | Limitado | ✓ |
| Bloqueado | ✓ | ✓ | ✗ | ✗ |
