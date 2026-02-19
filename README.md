# ConcretePM

**Solo PM Command Center** - A project management tool for concrete construction professionals.

## Features

### Core PM Tools
- **Projects** - Track phases, subphases, budgets, cost codes
- **Daily Reports** - Log progress, manpower, materials, equipment
- **Cost Tracking** - Budget vs actual, variance alerts
- **Equipment** - Rental tracking, invoices, returns

### Coming Soon
- **Buyout Log** - Track sub/supplier awards vs budget
- **Submittal Log** - Product data, shop drawings, approvals
- **RFI Log** - Questions to architect/engineer
- **Change Orders** - Scope/cost changes with approval workflow

### Future (Gamification)
- Points for staying on budget
- Streaks for daily reports
- Achievements and rewards

## Tech Stack
- Next.js 14 (App Router)
- Prisma + PostgreSQL
- NextAuth.js
- Tailwind CSS
- Vercel deployment

## Getting Started

```bash
npm install
cp .env.example .env  # Configure your database
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## License

Private - Oncor AI
