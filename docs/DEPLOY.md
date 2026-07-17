# Déploiement production — VerifyMyTicket

## Base de données : Postgres

En local le projet utilise SQLite (`DATABASE_URL="file:./dev.db"`).

Pour la production multi-instances :

1. Créez une base Postgres (Neon, Supabase, Railway, etc.).
2. Dans `prisma/schema.prisma`, changez :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Définissez `DATABASE_URL=postgresql://user:pass@host:5432/verifymyticket?sslmode=require`
4. Lancez `npx prisma migrate deploy` (ou `db push` pour un premier déploiement).

Le schéma Prisma (modèles) est compatible SQLite et Postgres.

## Rate limit Redis (Upstash)

Sans `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, le rate limit est en mémoire
(non partagé entre instances). **En production multi-replicas, configurez Upstash.**

## Variables recommandées en prod

Voir `.env.example` : JWT, HMAC, Resend, Turnstile, Google OAuth, VAPID, LEGAL_*.

## Rappels événements

Planifiez `npm run reminders` chaque jour (cron / GitHub Actions) pour les emails J-7 et J-1.
