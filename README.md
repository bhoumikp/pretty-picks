# Pretty Picks Ecommerce

Production-ready ecommerce-style website with admin panel for Pretty Picks.

## Tech Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth (credentials)

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Create `.env.local` from `.env.example`
```bash
cp .env.example .env.local
```

3. Set `DATABASE_URL` to your Supabase Postgres connection string.
4. Set Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

4. Generate Prisma client and push schema
```bash
npm run prisma:generate
npm run prisma:push
```

5. Seed demo data + admin user
```bash
npm run seed
```

6. Run the app
```bash
npm run dev
```

## Admin Login
- URL: `/admin/login`
- Default credentials (from seed):
  - Email: `admin@prettypicks.in`
  - Password: `PrettyPicks123`

## WhatsApp Settings
Update the WhatsApp number in `src/data/site.ts`.

## Image Uploads
Admin product images are uploaded to Cloudinary via `/api/uploads`. The returned URLs are stored on the product.

## Deployment
See the implementation notes in the response output for Vercel + Neon steps.
