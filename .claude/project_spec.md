# project_spec.md

## 1. Product Requirements

### 1.1 Product Overview

**APPCHULA** is a private institutional capital management and visualization platform designed for high-value, low-volume clients. The platform serves as a technological extension of an investment process that occurs primarily outside the platform, providing visibility, control, and traceability layers after compliance, contractual, and financial processes have been completed externally.

**Target Users:**
- Family Offices
- Venture Capital firms
- Patrimonial companies
- Institutional investors
- High-net-worth individuals (exceptional cases)

**Core Value Proposition:**
- Clear and updated view of client capital and balance
- Transparent evolution of yields over time
- Internal tool for control, traceability, and administrative management

**Key Characteristics:**
- No public registration or self-service onboarding
- All users are pre-qualified commercially and validated by compliance before platform access
- Single currency system (USD only)
- Manual administrative control over all critical operations
- Audit trail for all financial operations

### 1.2 Goals and Success Criteria

**Primary Goals:**
1. Provide institutional clients with clear, trustworthy visualization of their investments
2. Enable complete administrative control over financial operations
3. Maintain full traceability and auditability of all system operations
4. Support agent/super-agent commission structures accurately

**Success Metrics:**
- 100% traceability of all financial operations
- Zero unauthorized modifications to financial data
- Complete audit trail for compliance requirements
- Accurate commission calculations for agent network
- Session security with 20-minute inactivity timeout
- 2FA compliance for sensitive operations

### 1.3 In Scope / Out of Scope

**In Scope:**
- User management with invitation-based onboarding
- Client dashboard with financial visualization
- Balance and yield tracking (monthly closings)
- Withdrawal request management (quarterly windows)
- Agent and Super Agent commission system
- Complete Backoffice administration panel
- Audit logging for all critical operations
- Email notifications for key events
- Data export (CSV/Excel)
- Responsive web interface (desktop/mobile)
- 2FA for sensitive operations
- Preparation for future KYC/KYB integration (Sumsub)

**Out of Scope:**
- Public registration or self-service signup
- Deposit flows within the platform
- Real-time yield calculations
- Automatic bank/crypto transfers
- Native mobile applications
- Multi-currency support
- Social login integrations
- In-platform KYC/KYB verification (Phase 1)
- Automated trading or investment operations

---

## 2. Product Roadmap

### 2.1 Milestones Overview

| Phase | Name | Focus |
|-------|------|-------|
| MVP | Core Platform | User management, Dashboard, Withdrawals, Monthly Closings |
| v1.1 | Agent Network | Agent/Super Agent commissions, hierarchical views |
| v1.2 | Enhanced Security | Authenticator app 2FA, device management |
| v2.0 | KYC Integration | Sumsub integration, verification workflows |

### 2.2 MVP Definition

The MVP delivers a fully functional private investment platform with manual administrative control.

**Core Features:**

1. **User Management System**
   - Invitation-based account creation from Backoffice
   - User types: Client, Agent, Super Agent
   - Operational roles: Administrator, Operator
   - User states: Active, Blocked, (Reserved: Unverified)
   - Password creation via secure activation link

2. **Authentication & Security**
   - Email/password login
   - 2FA via email OTP for sensitive actions
   - 20-minute session timeout
   - Device recognition with 30-day remember option
   - Session invalidation on password change

3. **Client Dashboard**
   - Financial summary (initial capital, current balance, accumulated yield)
   - Balance evolution chart (monthly)
   - Yield history table
   - Withdrawal history and status tracking
   - Assigned agent contact information
   - Data export (CSV/Excel)

4. **Withdrawal Module**
   - Quarterly withdrawal windows (Mar 31, Jun 30, Sep 30, Dec 31)
   - 10-day advance request requirement
   - 3-month minimum tenure before first withdrawal
   - Partial and total withdrawal support
   - Three-state workflow: Requested → Approved → Executed

5. **Monthly Closing Process**
   - Manual yield percentage input by Administrator
   - Client-by-client validation list
   - Selective approval/exclusion per client
   - Irreversible balance updates
   - Guaranteed minimum yield enforcement per client

6. **Backoffice Administration**
   - Complete user CRUD operations
   - Financial data management
   - Withdrawal approval workflow
   - Monthly closing execution
   - Internal notes per user
   - Audit log access

7. **Notifications**
   - Email notifications for: monthly closing, withdrawal approval, withdrawal execution
   - Non-actionable, informational only

**MVP Limitations:**
- No KYC/KYB verification flows (users pre-verified externally)
- 2FA limited to email OTP (no authenticator app)
- No automated payment execution
- Agent commissions calculated but paid externally
- No real-time data updates (monthly snapshot model)

---

### 2.3 Future Versions

**Version 1.1 - Agent Network Enhancement**
- Full Agent dashboard with client portfolio view
- Super Agent dashboard with agent hierarchy
- Commission tracking and history
- Automated commission calculations on monthly close
- Commission accrual and quarterly settlement tracking

**Version 1.2 - Enhanced Security**
- TOTP Authenticator app support (Google Authenticator, Authy)
- Trusted device management
- Login attempt monitoring and alerts
- Enhanced session management

**Version 2.0 - KYC/KYB Integration**
- Sumsub integration via iframe/link
- Verification status tracking
- Conditional feature access based on verification
- Compliance documentation storage

---

## 3. Technical Specification

### 3.1 Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router) | Server components, excellent DX, SEO support |
| **Backend** | Supabase | PostgreSQL, Auth, Edge Functions, Row Level Security |
| **Database** | PostgreSQL (via Supabase) | ACID compliance, financial data integrity |
| **Auth** | Supabase Auth + Custom 2FA | Built-in auth with custom security layer |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, consistent design system |
| **Charts** | Recharts | React-native charting for financial data |
| **Email** | Resend | Transactional emails for notifications |
| **Hosting** | Vercel | Optimal Next.js deployment, edge network |
| **File Export** | xlsx + csv-stringify | Client-side export generation |

---

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                      Next.js (App Router)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Client     │  │    Agent     │  │  Backoffice  │           │
│  │  Dashboard   │  │  Dashboard   │  │    Panel     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER                                │
│                   Next.js Server Actions                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │     Auth     │  │   Financial  │  │    Admin     │           │
│  │   Actions    │  │   Actions    │  │   Actions    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │     Auth     │  │  PostgreSQL  │  │    Edge      │           │
│  │   Service    │  │   Database   │  │  Functions   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                           │                                      │
│                    Row Level Security                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │    Resend    │  │   Sumsub     │                             │
│  │   (Email)    │  │  (Future)    │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── activate/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── [token]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Client dashboard
│   │   ├── withdrawals/
│   │   │   └── page.tsx
│   │   ├── history/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── (agent)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Agent dashboard
│   │   └── clients/
│   │       └── page.tsx
│   ├── (backoffice)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Admin overview
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── monthly-closing/
│   │   │   └── page.tsx
│   │   ├── withdrawals/
│   │   │   └── page.tsx
│   │   ├── commissions/
│   │   │   └── page.tsx
│   │   └── audit-log/
│   │       └── page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── dashboard/
│   │   ├── financial-summary.tsx
│   │   ├── balance-chart.tsx
│   │   ├── yield-history-table.tsx
│   │   └── withdrawal-list.tsx
│   ├── backoffice/
│   │   ├── user-form.tsx
│   │   ├── closing-validation-table.tsx
│   │   └── withdrawal-approval-list.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── otp-input.tsx
│   │   └── password-form.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── export-button.tsx
│       └── agent-contact-card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── financial.ts
│   │   ├── withdrawals.ts
│   │   ├── monthly-closing.ts
│   │   └── commissions.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   ├── dates.ts
│   │   ├── formatting.ts
│   │   └── validation.ts
│   ├── email/
│   │   ├── client.ts
│   │   └── templates/
│   └── constants.ts
├── types/
│   ├── database.ts                     # Supabase generated types
│   ├── user.ts
│   ├── financial.ts
│   └── api.ts
├── hooks/
│   ├── use-user.ts
│   ├── use-financial-data.ts
│   └── use-withdrawal-windows.ts
└── middleware.ts
```

---

### 3.4 Data Flow

**Client Dashboard Load:**
```
1. Client navigates to /dashboard
2. middleware.ts validates session via Supabase Auth
3. Server Component fetches user data with RLS
4. Parallel queries: balance, yields, withdrawals, agent info
5. Server renders dashboard with financial data
6. Client hydrates interactive components (charts, tables)
```

**Withdrawal Request Flow:**
```
1. Client clicks "Request Withdrawal" (within valid window)
2. Client-side validation: window dates, minimum tenure, amount
3. Server Action: create_withdrawal_request
4. Server validates: user state, balance, window eligibility
5. Insert withdrawal record (status: 'requested')
6. Log audit entry
7. Send email notification to admins
8. Return success, update UI optimistically
```

**Monthly Closing Flow:**
```
1. Admin navigates to /backoffice/monthly-closing
2. Admin inputs yield percentage for the month
3. Server Action calculates projected balances per client
4. Display validation table with checkboxes
5. Admin reviews, excludes clients if needed
6. Admin confirms closing
7. Transaction: update balances, create yield records, log audit
8. Trigger email notifications to affected clients
9. Update dashboard data for next access
```

---

### 3.5 Database Schema

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  full_name VARCHAR(255) NOT NULL,

  -- User Type (mutually exclusive)
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'agent', 'super_agent')),

  -- Operational Roles (can have multiple)
  is_admin BOOLEAN DEFAULT FALSE,
  is_operator BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'unverified', 'blocked')),

  -- Relationships
  assigned_agent_id UUID REFERENCES users(id),
  parent_super_agent_id UUID REFERENCES users(id),

  -- Financial Settings
  guaranteed_min_yield DECIMAL(5,2) CHECK (guaranteed_min_yield IN (2.5, 3.25, 4.25, 5.0)),
  initial_capital DECIMAL(18,2) DEFAULT 0,
  current_balance DECIMAL(18,2) DEFAULT 0,
  yield_start_date DATE,

  -- KYC Preparation
  kyc_status VARCHAR(20) DEFAULT 'not_required',
  kyc_provider VARCHAR(50),
  kyc_verified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

**activation_tokens**
```sql
CREATE TABLE activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**yield_records**
```sql
CREATE TABLE yield_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Financial Data
  balance_before DECIMAL(18,2) NOT NULL,
  yield_percentage DECIMAL(5,2) NOT NULL,
  yield_amount DECIMAL(18,2) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,

  -- Proportional yield indicator (for mid-month starts)
  is_proportional BOOLEAN DEFAULT FALSE,

  -- Audit
  closing_id UUID REFERENCES monthly_closings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, year, month)
);
```

**monthly_closings**
```sql
CREATE TABLE monthly_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  yield_percentage DECIMAL(5,2) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'executed')),

  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(year, month)
);
```

**withdrawals**
```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Request Details
  amount DECIMAL(18,2) NOT NULL,
  withdrawal_type VARCHAR(20) NOT NULL CHECK (withdrawal_type IN ('partial', 'total')),
  target_window_date DATE NOT NULL,

  -- Status Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'executed', 'rejected')),

  -- Workflow Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES users(id),

  -- Notes
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**commissions**
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Beneficiary
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  beneficiary_type VARCHAR(20) NOT NULL CHECK (beneficiary_type IN ('agent', 'super_agent')),

  -- Source
  source_client_id UUID NOT NULL REFERENCES users(id),

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Financial
  base_balance DECIMAL(18,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(18,2) NOT NULL,

  -- Status (for agents: accumulated until quarterly settlement)
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accrued', 'settled')),

  settled_at TIMESTAMPTZ,
  settlement_closing_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**audit_logs**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),

  -- Action
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**user_notes**
```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**otp_codes**
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL, -- 'login', 'withdrawal', 'password_change'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**trusted_devices**
```sql
CREATE TABLE trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  trusted_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_fingerprint)
);
```

---

### 3.6 Authentication & Authorization

**Authentication Strategy:**

1. **Initial Access (Invitation Flow)**
   - Admin creates user in Backoffice
   - System generates single-use activation token (24h expiry)
   - Email sent with activation link
   - User sets password via activation page
   - Supabase Auth user created on activation

2. **Login Flow**
   - Email/password authentication via Supabase Auth
   - Device fingerprint check
   - If unknown device: require email OTP
   - If trusted device: direct access
   - Session created with 20-minute inactivity timeout

3. **2FA for Sensitive Actions**
   - Withdrawal requests
   - Password changes
   - Financial data modifications (Backoffice)
   - Email OTP sent, 5-minute validity

**Roles & Permissions Matrix:**

| Permission | Client | Agent | Super Agent | Operator | Admin |
|------------|--------|-------|-------------|----------|-------|
| View own dashboard | ✓ | ✓ | ✓ | - | - |
| View assigned clients | - | ✓ | ✓ | - | - |
| View agent network | - | - | ✓ | - | - |
| Request withdrawal | ✓ | ✓ | ✓ | - | - |
| Access Backoffice | - | - | - | ✓ | ✓ |
| View all users | - | - | - | ✓ | ✓ |
| Create/edit users | - | - | - | - | ✓ |
| Block users | - | - | - | - | ✓ |
| Execute monthly closing | - | - | - | - | ✓ |
| Approve withdrawals | - | - | - | - | ✓ |
| Edit financial data | - | - | - | - | ✓ |
| Add internal notes | - | - | - | ✓ | ✓ |
| View audit logs | - | - | - | ✓ | ✓ |

**Route Protection (middleware.ts):**
```typescript
const publicRoutes = ['/login', '/activate', '/forgot-password', '/reset-password'];
const backofficeRoutes = ['/backoffice'];
const agentRoutes = ['/agent'];

// Auth check for all non-public routes
// Role check for restricted areas
// Redirect blocked users to read-only mode
```

---

### 3.7 API Design

**Server Actions Structure:**

```typescript
// lib/actions/auth.ts
export async function loginAction(formData: FormData): Promise<ActionResult>
export async function verifyOtpAction(code: string, purpose: string): Promise<ActionResult>
export async function activateAccountAction(token: string, password: string): Promise<ActionResult>
export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<ActionResult>
export async function requestPasswordResetAction(email: string): Promise<ActionResult>

// lib/actions/users.ts
export async function createUserAction(data: CreateUserInput): Promise<ActionResult<User>>
export async function updateUserAction(id: string, data: UpdateUserInput): Promise<ActionResult<User>>
export async function blockUserAction(id: string): Promise<ActionResult>
export async function unblockUserAction(id: string): Promise<ActionResult>
export async function resendInvitationAction(id: string): Promise<ActionResult>
export async function addUserNoteAction(userId: string, content: string): Promise<ActionResult>

// lib/actions/financial.ts
export async function updateCapitalAction(userId: string, amount: number): Promise<ActionResult>
export async function getFinancialSummaryAction(userId: string): Promise<ActionResult<FinancialSummary>>
export async function getYieldHistoryAction(userId: string): Promise<ActionResult<YieldRecord[]>>
export async function exportFinancialDataAction(userId: string, format: 'csv' | 'xlsx'): Promise<ActionResult<Blob>>

// lib/actions/withdrawals.ts
export async function createWithdrawalRequestAction(data: WithdrawalInput): Promise<ActionResult<Withdrawal>>
export async function approveWithdrawalAction(id: string): Promise<ActionResult>
export async function executeWithdrawalAction(id: string): Promise<ActionResult>
export async function rejectWithdrawalAction(id: string, reason: string): Promise<ActionResult>
export async function getWithdrawalWindowsAction(): Promise<ActionResult<WithdrawalWindow[]>>

// lib/actions/monthly-closing.ts
export async function calculateClosingPreviewAction(year: number, month: number, yieldPercentage: number): Promise<ActionResult<ClosingPreview[]>>
export async function executeMonthlyClosingAction(year: number, month: number, yieldPercentage: number, excludedUserIds: string[]): Promise<ActionResult>
export async function getClosingHistoryAction(): Promise<ActionResult<MonthlyClosing[]>>

// lib/actions/commissions.ts
export async function calculateCommissionsAction(year: number, month: number): Promise<ActionResult<CommissionPreview[]>>
export async function settleAgentCommissionsAction(agentId: string): Promise<ActionResult>
export async function getCommissionHistoryAction(userId: string): Promise<ActionResult<Commission[]>>
```

**Input/Output Contracts:**

```typescript
// types/api.ts
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

interface CreateUserInput {
  email: string;
  fullName: string;
  phone?: string;
  userType: 'client' | 'agent' | 'super_agent';
  isAdmin?: boolean;
  isOperator?: boolean;
  assignedAgentId?: string;
  parentSuperAgentId?: string;
  initialCapital?: number;
  guaranteedMinYield?: 2.5 | 3.25 | 4.25 | 5.0;
}

interface WithdrawalInput {
  amount: number;
  withdrawalType: 'partial' | 'total';
}

interface FinancialSummary {
  initialCapital: number;
  currentBalance: number;
  accumulatedYield: number;
  accumulatedYieldPercentage: number;
  lastClosingDate: string;
}
```

**Error Handling:**

```typescript
// Standard error codes
const ErrorCodes = {
  // Auth
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  SESSION_EXPIRED: 'auth/session-expired',
  OTP_INVALID: 'auth/otp-invalid',
  OTP_EXPIRED: 'auth/otp-expired',

  // User
  USER_NOT_FOUND: 'user/not-found',
  USER_BLOCKED: 'user/blocked',
  EMAIL_EXISTS: 'user/email-exists',

  // Withdrawal
  WITHDRAWAL_WINDOW_CLOSED: 'withdrawal/window-closed',
  INSUFFICIENT_BALANCE: 'withdrawal/insufficient-balance',
  MINIMUM_TENURE_NOT_MET: 'withdrawal/minimum-tenure',

  // Financial
  CLOSING_ALREADY_EXECUTED: 'financial/closing-exists',
  MINIMUM_CAPITAL_NOT_MET: 'financial/minimum-capital',

  // General
  UNAUTHORIZED: 'general/unauthorized',
  VALIDATION_ERROR: 'general/validation-error',
  INTERNAL_ERROR: 'general/internal-error',
};
```

---

### 3.8 Non-Functional Requirements

**Performance:**
- Page load time: < 2 seconds (P95)
- Dashboard data fetch: < 500ms
- Monthly closing execution: < 30 seconds for 1000 users
- Export generation: < 10 seconds for 12-month history

**Security:**
- All data encrypted in transit (TLS 1.3)
- Passwords hashed with bcrypt (cost factor 12)
- Session tokens with secure, httpOnly cookies
- CSRF protection via Supabase
- Rate limiting: 10 login attempts per minute per IP
- SQL injection prevention via parameterized queries
- XSS prevention via React's automatic escaping
- Row Level Security on all tables
- Audit logging for all financial operations

**Scalability:**
- Support up to 10,000 users
- Handle 100 concurrent sessions
- Database capable of 5 years of historical data
- Horizontal scaling via Vercel edge deployment

**Maintainability:**
- TypeScript strict mode
- ESLint + Prettier enforcement
- Component-based architecture
- Comprehensive error logging
- Database migrations via Supabase CLI
- Environment-based configuration

**Availability:**
- 99.5% uptime target
- Automatic daily backups (30-90 day retention)
- Disaster recovery within 4 hours (RTO)
- Maximum 24-hour data loss (RPO)

**Compliance:**
- Full audit trail for financial operations
- Data retention as per regulatory requirements
- GDPR-ready data handling
- Prepared for KYC/KYB integration

---

### 3.9 Assumptions & Open Questions

**Assumptions:**

1. **User Volume**: System designed for < 10,000 total users with < 500 active monthly
2. **Financial Precision**: All monetary values use 2 decimal places (USD cents)
3. **Time Zone**: All dates/times stored in UTC, displayed in user's local time
4. **Yield Calculation**: Yields are simple interest, not compound, calculated monthly
5. **Commission Source**: Agent commissions come from Super Agent balance, not system-generated
6. **External Processes**: Actual money transfers happen outside the system
7. **Email Delivery**: Resend service provides sufficient deliverability for transactional emails
8. **Single Tenancy**: Platform serves single organization (APPCHULA), not multi-tenant

**Open Questions for Stakeholders:**

1. **Yield Precision**: Should internal calculations use more than 2 decimals before rounding for display?

2. **Commission Percentages**: What are the actual commission rates for Agents and Super Agents? Are they configurable per user?

3. **Withdrawal Rejection**: Can withdrawals be rejected? If so, what happens to the funds and what's the client notification flow?

4. **Capital Increments**: What's the process for adding capital to existing users? Is there a minimum increment?

5. **Audit Log Retention**: How long should audit logs be retained? Are there regulatory requirements?

6. **Email Templates**: Who provides the email copy and branding guidelines for notifications?

7. **Backup Testing**: What's the acceptable frequency for backup restore testing?

8. **Session Concurrency**: Should users be limited to one active session, or can they be logged in from multiple devices?

9. **Super Agent Hierarchy**: Can a Super Agent manage other Super Agents, or is the hierarchy flat?

10. **Blocked User Visibility**: Should blocked users still see their historical data, or should access be completely restricted?
