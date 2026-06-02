# know3D – e-shop

Slovenský e-shop pre 3D tlač s admin panelom, správou produktov, objednávok a požiadaviek na **Tlač na mieru**.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **TailwindCSS v4**
- **Prisma 7** + **Neon PostgreSQL** (cez `@prisma/adapter-neon`)
- Jednoduchá admin autentifikácia (cookie + JWT cez `jose`)
- Validácia cez **Zod**

## Štruktúra

```
src/
  app/
    (shop)/                # verejný e-shop (Navbar + Footer)
      page.tsx             # domovská stránka
      produkty/
        page.tsx           # zoznam + filter + vyhľadávanie
        [slug]/page.tsx    # detail produktu
      tlac-na-mieru/       # formulár požiadavky
      kosik/               # košík
      pokladna/            # checkout
      objednavka/[orderNumber]/  # potvrdenie objednávky
    admin/                 # admin panel (chránené middleware-om)
      page.tsx             # prehľad
      produkty/...         # CRUD produktov + obrázky
      skladom/             # rýchla úprava skladu
      objednavky/...       # objednávky + zmena stavu
      tlac/...             # požiadavky tlač na mieru
      login/               # prihlásenie
    api/
      images/[id]/         # obrázky produktov z DB
      products/by-ids/     # bulk fetch pre košík
      orders/              # vytvorenie objednávky
      custom-print/        # vytvorenie požiadavky
      admin/               # všetky chránené admin endpointy
  components/              # Navbar, Footer, ProductCard, formuláre, ...
    admin/                 # admin-only UI komponenty
  lib/
    prisma.ts              # Prisma client singleton
    auth.ts                # session JWT + .env credentials
    adminGuard.ts          # API route guard
    cart.ts                # localStorage košík
    format.ts              # formátovanie ceny/dátumu, slug
  middleware.ts            # ochrana /admin/*
prisma/
  schema.prisma            # schéma (Product, ProductImage, Order, OrderItem, CustomPrintRequest)
  seed.ts                  # ukážkové dáta
```

## Rýchly štart

### 1. Vytvor `.env`

Skopíruj `.env.example` do `.env` a doplň hodnoty:

```env
DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="silne-heslo"
ADMIN_SESSION_SECRET="náhodný reťazec, min. 32 znakov"
```

Úplný zoznam s voliteľným **Resend** nájdeš v [`.env.example`](./.env.example).

### Email zákazníkom (Resend)

Transakčné emaily používajú **[Resend](https://resend.com)** (`resend` SDK v `src/lib/email.ts`):

- **`RESEND_API_KEY`** – API kľúč z Resend dashbordu.
- **`EMAIL_FROM`** – napr. `know3D <objednavky@know3d.sk>` — doména v adrese musí byť v Resend **overená** (DNS). **Nepoužívaj `@resend.dev`** na produkcii pre zákazníkov — Resend to typicky blokne alebo doručí len na vlastný tímový email.
- **`NEXT_PUBLIC_SITE_URL`** *(odporúčané na Verceli)* – napr. `https://know3d.sk`. Ak chýba, použije sa automaticky host z `VERCEL_URL`, ale vlastná doména je spoľahlivejšia pre odkazy v mailoch.

Bez `RESEND_API_KEY` alebo bez `EMAIL_FROM` sa údaje (objednávka / požiadavka) uložia, ale mail sa neodosiela — **vo Vercel → tvoj projekt → Logs** uvidíš riadok `[email]` s tým, či premenné „CHÝBA“.

#### Viacnasadenie na **Vercel**

1. Otvor **Project → Settings → Environment Variables**.
2. Pridaj **`RESEND_API_KEY`**, **`EMAIL_FROM`**, **`NEXT_PUBLIC_SITE_URL`**, ako aj DB a admin (`DATABASE_URL`, `ADMIN_*`).
3. Uisti sa, že sú priradené k prostrediu, ktoré používaš (**Production**, prípadne aj **Preview** na test deployov).
4. Po pridaní alebo zmene premenných urob **`Redeploy`** (Deployments → … → Redeploy) — inak bežné nasadenie môže stále čítať staré env bez kľúčov.

> **Tip:** vygenerovať tajný kľúč:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 2. Inštalácia a generovanie klienta

```bash
npm install
npm run db:generate
```

### 3. Vytvorenie tabuliek

Pre prvý beh stačí:

```bash
npm run db:push
```

(Pre produkčné nasadenie použi `npm run db:migrate` na vytvorenie migrácií.)

### 4. (Voliteľné) Naplniť ukážkové produkty

```bash
npm run db:seed
```

### 5. Štart vývojového servera

```bash
npm run dev
```

- E-shop: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>

## Admin – kde sa čo dá

| Cesta | Čo robí |
|---|---|
| `/admin` | Prehľad – štatistiky, najnovšie objednávky a požiadavky |
| `/admin/produkty` | Zoznam produktov, prepínače „Aktívny", „Hlavná stránka", „Hit týždňa" |
| `/admin/produkty/novy` | Pridanie nového produktu vrátane obrázkov |
| `/admin/produkty/[id]` | Úprava + správa obrázkov (nastav hlavný, zmaž) |
| `/admin/skladom` | Rýchla zmena skladu (priamo prepojené s kartou produktu) |
| `/admin/objednavky` | Všetky objednávky + zmena stavu |
| `/admin/tlac` | Požiadavky na tlač na mieru, sťahovanie príloh, cenová ponuka |

### Ako vybrať produkty na hlavnú stránku

1. Choď na `/admin/produkty`
2. Pre každý produkt zapni prepínač **„Hlavná str."** (a voliteľne nastav `homeSortOrder` v detaile)
3. Pre Hit týždňa zapni **„Hit týždňa"** (jeden produkt)

## Obrázky

Všetky obrázky produktov **a prílohy k Tlači na mieru** sa ukladajú priamo v databáze (`Bytes` cez Prisma) – tak, ako si to chcel. Servuje ich endpoint `/api/images/[id]` s dlhodobým HTTP cache.

> **Limit:** 8 MB / obrázok (produkt), 25 MB / súbor (Tlač na mieru). Limity zmeníš v API route handleroch.

## Bezpečnosť

- Admin endpointy sú chránené:
  - **Stránky:** middleware (`src/middleware.ts`) → redirect na `/admin/login`
  - **API:** `requireAdmin()` v `src/lib/adminGuard.ts`
- Heslo a meno admina sú v `.env`. Cookie je `httpOnly`, `SameSite=Lax`, v produkcii `Secure`.

## Užitočné príkazy

```bash
npm run dev           # dev server
npm run build         # produkčný build
npm run start         # produkčný server
npm run typecheck     # tsc --noEmit
npm run db:studio     # GUI nad databázou
npm run db:push       # synchronizácia schémy → DB (bez migrácií)
npm run db:migrate    # vytvorenie migrácie a aplikácia
npm run db:seed       # ukážkové dáta
```
