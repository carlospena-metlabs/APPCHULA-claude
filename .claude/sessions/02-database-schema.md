# Session 02: Database Schema

## Agent: `database-agent`

## Objective
Create all database tables, indexes, and Row Level Security (RLS) policies in Supabase.

## Dependencies
- Session 01 completed
- Supabase project created and configured

---

## Tasks

### 2.1 Create Migration File

Create `supabase/migrations/001_initial_schema.sql`

### 2.2 Users Table
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'cliente' CHECK (user_type IN ('cliente', 'agente', 'super_agente')),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'no_verificado', 'bloqueado')),

  -- Commercial relationships
  agent_id UUID REFERENCES public.users(id),
  super_agent_id UUID REFERENCES public.users(id),

  -- Operational roles
  is_admin BOOLEAN DEFAULT FALSE,
  is_operator BOOLEAN DEFAULT FALSE,

  -- KYC preparation (future)
  kyc_status TEXT DEFAULT 'pending',
  kyc_provider TEXT,
  kyc_verified_at TIMESTAMPTZ,

  -- Financial data
  initial_capital DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  guaranteed_percentage DECIMAL(5,2) CHECK (guaranteed_percentage IN (2.5, 3.25, 4.25, 5.0)),
  yield_start_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- Index for common queries
CREATE INDEX idx_users_user_type ON public.users(user_type);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_agent_id ON public.users(agent_id);
CREATE INDEX idx_users_super_agent_id ON public.users(super_agent_id);
```

### 2.3 Capital Movements Table
```sql
CREATE TABLE public.capital_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposito_inicial', 'incremento', 'retiro', 'comision_entrada', 'comision_salida', 'ajuste')),
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  executed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_capital_movements_user_id ON public.capital_movements(user_id);
CREATE INDEX idx_capital_movements_type ON public.capital_movements(type);
CREATE INDEX idx_capital_movements_created_at ON public.capital_movements(created_at);
```

### 2.4 Monthly Yields Table
```sql
CREATE TABLE public.monthly_yields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  percentage_applied DECIMAL(5,2) NOT NULL,
  yield_amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  is_proportional BOOLEAN DEFAULT FALSE,
  executed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_monthly_yields_user_id ON public.monthly_yields(user_id);
CREATE INDEX idx_monthly_yields_year_month ON public.monthly_yields(year, month);
```

### 2.5 Monthly Closures Table
```sql
CREATE TABLE public.monthly_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  percentage DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'executed')),
  total_users_affected INTEGER DEFAULT 0,
  total_yield_amount DECIMAL(15,2) DEFAULT 0,
  executed_by UUID REFERENCES public.users(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);
```

### 2.6 Withdrawals Table
```sql
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('parcial', 'total')),
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprobado', 'ejecutado', 'rechazado')),
  withdrawal_window DATE NOT NULL,

  -- Tracking
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,

  notes TEXT
);

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_window ON public.withdrawals(withdrawal_window);
```

### 2.7 Commissions Table
```sql
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES public.users(id),
  source_user_id UUID NOT NULL REFERENCES public.users(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  base_amount DECIMAL(15,2) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'acreditada')),
  credited_at TIMESTAMPTZ,
  credited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commissions_beneficiary ON public.commissions(beneficiary_id);
CREATE INDEX idx_commissions_source ON public.commissions(source_user_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_year_month ON public.commissions(year, month);
```

### 2.8 Invitations Table
```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_user_id ON public.invitations(user_id);
```

### 2.9 Audit Logs Table
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
```

### 2.10 Internal Notes Table
```sql
CREATE TABLE public.internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_internal_notes_user_id ON public.internal_notes(user_id);
```

### 2.11 Updated At Trigger
```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.12 Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Operators can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_operator = true)
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Agents can view their associated clients
CREATE POLICY "Agents can view their clients" ON public.users
  FOR SELECT USING (
    agent_id = auth.uid() OR super_agent_id = auth.uid()
  );

-- Capital movements policies
CREATE POLICY "Users can view own movements" ON public.capital_movements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all movements" ON public.capital_movements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert movements" ON public.capital_movements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Monthly yields policies
CREATE POLICY "Users can view own yields" ON public.monthly_yields
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage yields" ON public.monthly_yields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Monthly closures policies
CREATE POLICY "Admins can manage closures" ON public.monthly_closures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Operators can view closures" ON public.monthly_closures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_operator = true)
  );

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Commissions policies
CREATE POLICY "Users can view own commissions" ON public.commissions
  FOR SELECT USING (beneficiary_id = auth.uid());

CREATE POLICY "Admins can manage commissions" ON public.commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Invitations policies
CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Internal notes policies
CREATE POLICY "Admins can manage notes" ON public.internal_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Operators can manage notes" ON public.internal_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_operator = true)
  );
```

### 2.13 Create Seed Data
```sql
-- supabase/seed.sql

-- Note: First create the admin user in Supabase Auth, then run this
-- Replace 'ADMIN_USER_UUID' with actual UUID from auth.users

-- INSERT INTO public.users (id, email, full_name, user_type, is_admin, guaranteed_percentage)
-- VALUES ('ADMIN_USER_UUID', 'admin@appchula.com', 'Admin User', 'cliente', true, 5.0);
```

---

## Files to Create

- [x] `supabase/migrations/001_initial_schema.sql`
- [x] `supabase/seed.sql`

---

## Acceptance Criteria

- [ ] All migrations run without errors
- [ ] All tables exist in Supabase dashboard
- [ ] RLS is enabled on all tables
- [ ] Indexes are created
- [ ] Foreign key constraints work correctly
- [ ] Admin user can be created and has full access
