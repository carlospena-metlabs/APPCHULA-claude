# Session 10: Integration & Testing

## Agent: `qa-agent`

## Objective
Perform end-to-end validation of all MVP features, fix integration issues, and ensure the system works as a cohesive whole.

## Dependencies
- All previous sessions completed (01-09)

---

## Tasks

### 10.1 Environment Validation

```bash
# Verify all environment variables are set
npm run build

# Check Supabase connection
# Verify RLS policies work correctly
# Test auth flow end-to-end
```

### 10.2 Feature Checklist

#### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Blocked user cannot access dashboard
- [ ] Invitation email flow works
- [ ] Activation with valid token
- [ ] Activation with expired token fails
- [ ] Password reset flow
- [ ] Session timeout after 20 minutes
- [ ] Logout clears session

#### Client Dashboard
- [ ] Financial summary shows correct values
- [ ] Balance chart renders with data
- [ ] Balance chart handles empty data
- [ ] Yields history table populates
- [ ] Profile page shows user info
- [ ] Agent info visible if assigned
- [ ] Responsive on mobile

#### Backoffice - Users
- [ ] Users list loads
- [ ] Filter by type works
- [ ] Filter by status works
- [ ] Search by name/email works
- [ ] Create user form validates
- [ ] User created in Auth + DB
- [ ] Edit user updates correctly
- [ ] Block user works
- [ ] Unblock user works
- [ ] Send invitation generates token
- [ ] Operators cannot modify data

#### Backoffice - Capital
- [ ] Add initial capital updates balance
- [ ] Add increment updates balance
- [ ] Adjust balance works (positive)
- [ ] Adjust balance works (negative)
- [ ] Balance cannot go negative
- [ ] Capital movements recorded
- [ ] Set yield start date works

#### Monthly Close
- [ ] Calculate preview shows all users
- [ ] Users below 50k excluded
- [ ] Users without start date excluded
- [ ] Guaranteed percentage applied
- [ ] Proportional first month works
- [ ] Execute updates all balances
- [ ] Yield records created
- [ ] Cannot close same month twice
- [ ] Closure history visible

#### Withdrawals
- [ ] Client sees next window
- [ ] Seniority check works
- [ ] Cannot request outside window
- [ ] Request creates withdrawal
- [ ] Only one pending allowed
- [ ] Admin can approve
- [ ] Admin can execute (balance updates)
- [ ] Admin can reject with reason
- [ ] History visible to client

#### Audit Logs
- [ ] All actions logged
- [ ] Logs page loads
- [ ] Filters work
- [ ] Log detail shows values
- [ ] Pagination works

### 10.3 Integration Tests

Create test scenarios for critical flows:

**test/integration/auth.test.ts**
```typescript
describe('Authentication Flow', () => {
  it('should create user and send invitation')
  it('should activate account with valid token')
  it('should login with activated account')
  it('should block user from dashboard')
})
```

**test/integration/yields.test.ts**
```typescript
describe('Monthly Yield Flow', () => {
  it('should calculate yields correctly')
  it('should apply guaranteed percentage')
  it('should handle proportional first month')
  it('should execute close and update balances')
})
```

**test/integration/withdrawals.test.ts**
```typescript
describe('Withdrawal Flow', () => {
  it('should validate withdrawal eligibility')
  it('should create withdrawal request')
  it('should process approval workflow')
  it('should deduct balance on execution')
})
```

### 10.4 Performance Checks

- [ ] Dashboard loads < 2s
- [ ] Users list with 100 users < 1s
- [ ] Monthly close preview < 3s
- [ ] Audit logs pagination < 1s

### 10.5 Security Checks

- [ ] RLS prevents unauthorized data access
- [ ] Admin routes protected
- [ ] Operators cannot execute admin actions
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escaping)
- [ ] CSRF protected (Server Actions)

### 10.6 Bug Fixes

Document and fix any issues found during testing:

```markdown
## Bug Log

| ID | Description | Status | Fix |
|----|-------------|--------|-----|
| B001 | Example bug | Fixed | PR #123 |
```

### 10.7 Final Validation

- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] All pages render without errors
- [ ] Mobile responsive verified
- [ ] Create admin user for production

---

## Test Data Setup

### Create Test Users

```sql
-- Run after migrations
-- Create test admin (must exist in auth.users first)

-- Test client
INSERT INTO public.users (id, email, full_name, user_type, is_admin, guaranteed_percentage, initial_capital, current_balance)
VALUES ('test-client-uuid', 'cliente@test.com', 'Cliente Test', 'cliente', false, 3.25, 100000, 100000);

-- Test agent
INSERT INTO public.users (id, email, full_name, user_type, guaranteed_percentage)
VALUES ('test-agent-uuid', 'agente@test.com', 'Agente Test', 'agente', 2.5);

-- Test super agent
INSERT INTO public.users (id, email, full_name, user_type, guaranteed_percentage)
VALUES ('test-super-uuid', 'super@test.com', 'Super Test', 'super_agente', 2.5);
```

### Test Scenarios Data

```sql
-- Add yields for chart testing
INSERT INTO public.monthly_yields (user_id, year, month, percentage_applied, yield_amount, balance_before, balance_after)
VALUES
  ('test-client-uuid', 2024, 1, 3.25, 3250, 100000, 103250),
  ('test-client-uuid', 2024, 2, 3.25, 3355.63, 103250, 106605.63),
  ('test-client-uuid', 2024, 3, 3.25, 3464.68, 106605.63, 110070.31);
```

---

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase project configured
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Admin user created
- [ ] Initial data seeded
- [ ] Backup configured
- [ ] Monitoring enabled

---

## Files to Create

- [x] `test/integration/auth.test.ts`
- [x] `test/integration/yields.test.ts`
- [x] `test/integration/withdrawals.test.ts`
- [x] `scripts/seed-test-data.ts`
- [x] `TESTING.md` (test documentation)

---

## Acceptance Criteria

- [ ] All checklist items pass
- [ ] No critical bugs remaining
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Build succeeds
- [ ] Ready for production deployment
