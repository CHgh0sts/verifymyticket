# VerifyMyTicket

Plateforme de détection de billets revendus plusieurs fois. Les QR codes / codes-barres sont hashés avec **HMAC-SHA-256** et jamais stockés en clair.

## Stack

- Next.js (App Router) + JavaScript
- TailwindCSS
- Prisma + **SQLite** (fichier local `prisma/dev.db`)
- JWT HttpOnly Cookie + bcrypt
- Zod + React Hook Form
- Resend (emails)
- Cloudflare Turnstile (CAPTCHA)
- Upstash Redis (rate limiting, optionnel en local)

## Prérequis

- Node.js 20+

## Installation

```bash
npm install
cp .env.example .env
```

Éditez `.env` :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./dev.db` (SQLite local) |
| `JWT_SECRET` | Secret JWT (≥ 32 caractères) |
| `BARCODE_HMAC_SECRET` | Secret HMAC barcodes (≥ 32, **différent** de JWT) |
| `NEXT_PUBLIC_APP_URL` | URL publique (ex. `http://localhost:3000`) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Emails (sinon liens loggés en console) |
| `TURNSTILE_*` | CAPTCHA (sinon skip en dev) |
| `UPSTASH_*` | Rate limit Redis (sinon mémoire en dev) |
| `TICKETMASTER_API_KEY` | API gratuite Discovery (sinon mode démo sur `/check`) |

## Base de données

```bash
npm run db:init
```

Cela :
1. crée `.env` depuis `.env.example` si besoin
2. génère le client Prisma
3. crée `prisma/dev.db` (SQLite) et applique le schéma
4. insère le compte admin par défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin@verifymyticket.local` |
| Mot de passe | `Admin123!` |
| Username | `admin` |

Le compte est déjà **email vérifié**. La base `.db` n'est **pas** versionnée (voir `.gitignore`).

Commandes utiles :
```bash
npm run db:push    # schéma seul
npm run db:seed    # admin seul
```

## Lancer

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- Inscription / connexion / déconnexion
- Vérification email & mot de passe oublié
- Enregistrement de billets (formulaire + scan caméra)
- Détection de doublons avec score de risque
- Vérification publique sans compte (`/check`)
- Dashboard : billets, doublons, stats, profil

## Sécurité barcode

```
HMAC_SHA256(BARCODE_HMAC_SECRET, valeur_du_code)
```

Seul le hash (et éventuellement les 4 derniers caractères masqués) est persisté. Impossible de reconstruire le QR à partir de la base.

## API

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/api/auth/register` | non |
| POST | `/api/auth/login` | non |
| POST | `/api/auth/logout` | cookie |
| GET | `/api/auth/verify-email?token=` | non |
| POST | `/api/auth/forgot-password` | non |
| POST | `/api/auth/reset-password` | non |
| GET/PATCH | `/api/profile` | oui |
| GET/POST | `/api/tickets` | oui |
| GET/DELETE | `/api/tickets/:id` | oui |
| POST | `/api/check` | non (+ CAPTCHA) |

## Production

```bash
npm run build
npm start
```

Déployer avec HTTPS, secrets forts, Resend, Turnstile et Upstash Redis configurés. Pour la production, vous pourrez migrer vers PostgreSQL en changeant le provider Prisma.
