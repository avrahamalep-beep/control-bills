# control-bills

Portal web para control de gastos, deudas y vista mensual/anual (Next.js + Prisma + Neon + Auth.js).

## Desarrollo local

```bash
npm install
npx prisma db push
npm run dev
```

Configura `.env` a partir de `.env.example` (no subas secretos a git).

## Despliegue

Web Service en Render, variables de entorno `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`, `NEXTAUTH_URL`, `ALLOWED_EMAILS`.
