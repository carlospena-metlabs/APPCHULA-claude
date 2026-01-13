# APPCHULA

Plataforma privada de gestión y visualización de capital institucional para inversores cualificados.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **Hosting**: Vercel

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
npm run test         # Run tests
```

## Project Structure

```
app/
├── (auth)/          # Login, activate, reset-password
├── (dashboard)/     # Client dashboard views
├── (backoffice)/    # Admin panel
└── api/             # Webhooks

lib/
├── supabase/        # Supabase clients
├── actions/         # Server actions
└── utils/           # Helpers

supabase/
└── migrations/      # Database migrations
```

## Key Conventions

- **Currency**: USD only, 2 decimal places
- **User types**: cliente, agente, super_agente
- **Roles**: is_admin, is_operator (independent of user type)
- **Auth**: Invitation-only, no public registration
- **Yields**: Manual monthly close, never automatic
- **Withdrawals**: Quarterly windows (Mar 31, Jun 30, Sep 30, Dec 31)

## Database

Main tables: `users`, `capital_movements`, `monthly_yields`, `monthly_closures`, `withdrawals`, `commissions`, `audit_logs`

All financial operations must be logged in `audit_logs`.

## Spec Reference

Full specification at `.claude/docs/projectSpec.md`
