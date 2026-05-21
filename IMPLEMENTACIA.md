# Implementácia — Pay by Square, 2-krokový checkout & Packeta integrácia

Tento dokument popisuje všetky zmeny a nové funkcie, ktoré boli pridané do projektu **iknow3D e-shop**. Slúži ako technická referencia pre ďalší rozvoj.

---

## Obsah

1. [Prehľad zmien](#prehľad-zmien)
2. [Pay by Square — QR platba](#1-pay-by-square--qr-platba)
3. [2-krokový checkout](#2-2-krokový-checkout)
4. [Packeta — generovanie štítkov (admin)](#3-packeta--generovanie-štítkov-admin)
5. [Packeta — výber pobočky zákazníkom (checkout)](#4-packeta--výber-pobočky-zákazníkom-checkout)
6. [Zmenené súbory](#zmenené-súbory)
7. [Nové env premenné](#nové-env-premenné)
8. [Schéma databázy — nové stĺpce](#schéma-databázy--nové-stĺpce)
9. [Nasadenie](#nasadenie)
10. [Zoznam opravených bugov](#zoznam-opravených-bugov)

---

## Prehľad zmien

| Funkcia | Popis |
|---|---|
| **Pay by Square QR** | Automatické generovanie QR kódu pri vytvorení objednávky (LZMA1 + CRC32 + Base32) |
| **2-krokový checkout** | Objednávka sa vytvorí pri "Pokračovať k platbe", zákazník vidí QR + VS ešte pred finalizáciou |
| **Packeta štítky (admin)** | Vytvorenie zásielky v Packeta API + stiahnutie PDF štítku priamo z admin panelu |
| **Packeta widget (checkout)** | Zákazník si vyberie Z-BOX / pobočku priamo v checkoutovom flow |
| **Rate limiting** | Ochrana `/api/orders` (5 req/min) a `/api/pay-by-square` (15 req/min) |

---

## 1. Pay by Square — QR platba

### Ako to funguje

Pri vytvorení objednávky server vygeneruje QR kód vo formáte **Pay by Square** (slovenský štandard pre platbu prevodom). QR kód obsahuje IBAN, sumu, variabilný symbol a správu.

Zákazník naskenuje QR kód v bankovej aplikácii a platobné údaje sa automaticky vyplnia.

### Technické detaily

**Súbor:** `src/lib/pay-by-square.ts`

- Implementácia Pay by Square v1.1.0 špecifikácie
- Komprimácia: **LZMA1** cez systémový `xz` binary (Homebrew: `/opt/homebrew/bin/xz`)
- Checksum: **CRC32** (IEEE polynomial)
- Encoding: vlastná **Base32** abeceda `0123456789ABCDEFGHIJKLMNOPQRSTUV`
- Výstup: `data:image/png;base64,...` (inline QR obrázok)
- Funkcia: `generatePaymentQR(input: GenerateQRInput): Promise<GenerateQRResult>`

**Variabilný symbol:** odvodený z čísla objednávky, len číslice — `"2026-001234"` → `"2026001234"`

**Splatnosť:** automaticky dnes + 7 dní

### QR v objednávke

QR kód je uložený v DB stĺpci `qrCodeDataUrl` (Text) priamo pri vytvorení objednávky. Ak generovanie zlyhá (napr. `xz` nie je nainštalovaný), objednávka sa napriek tomu vytvorí — zákazník môže platiť manuálne z platobných údajov.

### Kde sa zobrazuje

- **Checkout — krok 2:** QR + IBAN + VS + suma
- **Stránka objednávky** (`/objednavka/[orderNumber]`): sekcia "Platba prevodom" s QR kódom

---

## 2. 2-krokový checkout

### Flow

```
Krok 1: Formulár (kontaktné + doručovacie údaje)
          ↓ klik "Pokračovať k platbe →"
          ↓ POST /api/orders — objednávka vznikne v DB
Krok 2: Platba (QR kód + IBAN + VS + suma)
          ↓ klik "Dokončiť objednávku →"
          ↓ redirect na /objednavka/[orderNumber]
```

### Prečo takto

Zákazník vidí presné platobné údaje (vrátane variabilného symbolu = čísla objednávky) ešte pred finalizáciou, bez toho aby musel čakať na email.

### Kľúčová oprava — redirect bug

`clearCart()` interne volá `clearShippingMethodId()`, čo dispatche `iknow3d:shipping-changed`. Listener v `CheckoutForm` zaregistroval zmenu a redirect efekt sa spustil pred tým, ako sa stihol vyrenderovať platobný krok.

**Fix:** `useEffect` pre redirect obsahuje guard `if (step !== "form") return;`

---

## 3. Packeta — generovanie štítkov (admin)

### Kde to nájdeš

Admin → Objednávky → detail objednávky → panel **Packeta** (zobrazí sa len pri `packeta-pickup` alebo `packeta-home` doprave)

### Flow

1. Objednávka musí byť v stave **PAID**
2. Admin klikne **"Vytvoriť zásielku"** → zavolá `POST /api/admin/orders/[id]/packeta/create`
3. Packeta API vráti `packetId` a `trackingNumber` → uloží sa do DB
4. Admin klikne **"Vygenerovať štítok (PDF)"** → zavolá `POST /api/admin/orders/[id]/packeta/label`
5. PDF sa stiahne priamo do prehliadača

### API klient

**Súbor:** `src/lib/packeta/client.ts`

- `getPacketaConfig()` — načíta a validuje env premenné
- `splitCustomerName(fullName)` — rozdeľuje "Ján Novák" → `{firstName: "Ján", lastName: "Novák"}`
- `createPacket(input)` → Packeta XML REST API, endpoint `/rest`
- `getLabelPdf(packetId, format?)` → stiahne PDF štítok z Packeta API

### Packeta XML API

Packeta používa XML cez HTTP POST na `https://www.zasilkovna.cz/api/rest`. Všetky requesty musia obsahovať `apiPassword` a sú obalené v `<createPacket>` resp. `<packetLabelPdf>` elementoch.

---

## 4. Packeta — výber pobočky zákazníkom (checkout)

### Flow

1. Zákazník na `/pokladna/doprava` vyberie **Packeta – výdajné miesto**
2. Zobrazí sa sekcia s tlačidlom **"Vybrať výdajné miesto"**
3. Kliknutím sa načíta JS widget z `https://widget.packeta.com/v6/www/js/library.js`
4. Widget sa otvorí ako fullscreen overlay — zákazník nájde Z-BOX alebo pobočku a potvrdí výber
5. Vybraná pobočka sa uloží do `sessionStorage`
6. V checkoutovom formulári sa pobočka odošle s objednávkou a uloží do DB

### Kritická poznatka — správne poradie parametrov

Packeta Widget v6 API:
```javascript
// SPRÁVNE:
Packeta.Widget.pick(apiKey, callback, opts, inElement?)

// CHYBNE (callback a opts prehodené):
Packeta.Widget.pick(apiKey, opts, callback, inElement?)
```

Chybné poradie spôsobilo, že widget sa otvoril, ale callback nikdy nebol zavolaný — namiesto callback funkcie dostal widget objekt `{country:"sk"}`.

### Úložisko výberu

**Súbor:** `src/lib/packeta-selection.ts`

```typescript
getPacketaPoint(): PacketaPoint | null
setPacketaPoint(point: PacketaPoint): void
clearPacketaPoint(): void
```

Ukladá: `pointId`, `pointName`, `pointAddress`, `isoCountry` do `sessionStorage`.
Pri zmene dispatche `iknow3d:packeta-point-changed` event.

---

## Zmenené súbory

### Nové súbory

| Súbor | Popis |
|---|---|
| `src/lib/pay-by-square.ts` | Pay by Square engine (LZMA1 + CRC32 + Base32 + QR) |
| `src/lib/rate-limit.ts` | In-memory rate limiter (bucket-based) |
| `src/lib/packeta/client.ts` | Packeta XML API klient |
| `src/lib/packeta-selection.ts` | SessionStorage getter/setter pre vybranú pobočku |
| `src/app/api/pay-by-square/route.ts` | `POST /api/pay-by-square` — standalone QR endpoint |
| `src/app/api/checkout-preview/route.ts` | `POST /api/checkout-preview` — QR bez VS (preview) |
| `src/app/api/admin/orders/[id]/packeta/create/route.ts` | `POST` — vytvorenie zásielky v Packeta |
| `src/app/api/admin/orders/[id]/packeta/label/route.ts` | `POST` — stiahnutie PDF štítku |
| `src/components/admin/PacketaPanel.tsx` | Admin UI panel pre správu Packeta zásielky |

### Upravené súbory

| Súbor | Čo sa zmenilo |
|---|---|
| `prisma/schema.prisma` | Nové stĺpce v `Order` modeli (viď sekcia nižšie) |
| `src/app/api/orders/route.ts` | QR generovanie, rate limiting, packeta polia, variabilný symbol |
| `src/components/CheckoutForm.tsx` | 2-krokový flow, packeta validácia, redirect bug fix |
| `src/components/ShippingDopravaForm.tsx` | Packeta widget integrácia, výber pobočky |
| `src/app/admin/objednavky/[id]/page.tsx` | PacketaPanel, zobrazenie pobočky vs. adresy |
| `src/app/(shop)/objednavka/[orderNumber]/page.tsx` | Sekcia "Platba prevodom" s QR kódom |
| `.env` | Nové premenné (PAYMENT_IBAN, Packeta credentials) |

---

## Nové env premenné

Skopíruj `.env.example` a doplň hodnoty:

```env
# Pay by Square — QR platba
PAYMENT_IBAN="SK29XXXXXXXXXXXXXXXXXXXX"   # IBAN účtu pre platby
PAYMENT_SWIFT=""                           # SWIFT/BIC (voliteľné)
PAYMENT_RECIPIENT_NAME=""                  # Názov príjemcu (voliteľné)

# Packeta API — REST (pre admin štítky)
PACKETA_API_PASSWORD="váš-api-password"   # Heslo API z Packeta účtu
PACKETA_ESHOP="názov-eshopu"              # Identifikátor eshopu v Packeta
PACKETA_API_URL="https://www.zasilkovna.cz/api/rest"
PACKETA_DEFAULT_WEIGHT_KG="0.5"
PACKETA_DEFAULT_CURRENCY="EUR"
PACKETA_LABEL_FORMAT="A6 on A6"

# Packeta Widget — pre zákazníkov (NEXT_PUBLIC_ = dostupné v browseri)
NEXT_PUBLIC_PACKETA_API_KEY="váš-verejný-api-kľúč"  # Kľúč API z Packeta účtu
```

### Kde nájdeš Packeta API kľúče

1. Prihlás sa na [client.packeta.com](https://client.packeta.com)
2. Profil → API kľúče
3. **Kľúč API** → `NEXT_PUBLIC_PACKETA_API_KEY` (pre widget)
4. **Heslo API** → `PACKETA_API_PASSWORD` (pre REST API)

---

## Schéma databázy — nové stĺpce

V tabuľke `Order` pribudli tieto stĺpce:

```prisma
model Order {
  # ... existujúce stĺpce ...

  # Pay by Square
  qrCodeDataUrl   String?   @db.Text      # data:image/png;base64,...

  # Packeta — výdajné miesto (vybraté zákazníkom)
  packetaPointId      String?             # ID pobočky napr. "12345"
  packetaPointName    String?             # Názov "Z-BOX Bratislava..."
  packetaPointAddress String?             # Adresa "Obchodná 12, 811 01 Bratislava"
  packetaIsoCountry   String?             # "SK"

  # Packeta — zásielka (vytvorená adminom)
  packetaPacketId         String?  @unique # ID zásielky v Packeta systéme
  packetaTrackingNumber   String?          # Číslo pre tracking
  packetaStatus           String?          # "created" | "label_ready" | "error"
  packetaCreatedAt        DateTime?
  packetaError            String?  @db.Text
}
```

**Po zmene schémy spusti:**
```bash
npx prisma db push
npx prisma generate
```

---

## Nasadenie

### Vercel (odporúčané)

1. Prepoj GitHub repo s Vercel projektom
2. V Vercel Environment Variables nastav všetky premenné z `.env.example`
3. Build command: `npm run build` (Vercel to detekuje automaticky)
4. Po nasadení spusti schema sync: `npx prisma db push` (z lokálu s prod DATABASE_URL)

### Požiadavky na server pre Pay by Square

Pay by Square vyžaduje `xz` binary (LZMA1 komprimácia):
- **Vercel / Linux:** `apt-get install xz-utils` (dostupné v štandarde)
- **macOS lokál:** `brew install xz`
- **Cesta:** `/opt/homebrew/bin/xz` (macOS), `/usr/bin/xz` (Linux)

Funkcia `findXzBinary()` automaticky prehľadáva tieto cesty.

---

## Zoznam opravených bugov

### Bug 1 — Redirect pri prechode na platobný krok

**Symptóm:** Po kliknutí "Pokračovať k platbe" sa stránka presmerovala späť na `/pokladna/doprava` namiesto zobrazenia QR kódu.

**Príčina:** `clearCart()` → `clearShippingMethodId()` → dispatch `iknow3d:shipping-changed` → `useEffect` detekoval chýbajúci shipping a spustil redirect, kým ešte boli položky v lokálnom React state.

**Fix:** `if (step !== "form") return;` na začiatku redirect effectu.

---

### Bug 2 — Packeta widget callback sa nikdy nevolal

**Symptóm:** Widget sa otvoril, zákazník vybral pobočku, potvrdil — ale stránka ignorovala výber.

**Príčina:** Chybné poradie parametrov pri volaní `Packeta.Widget.pick`. Správny podpis:
```
pick(apiKey, callback, opts, inElement?)
```
Callback bol odovzdaný ako tretí argument namiesto druhého — widget ho ignoroval a namiesto neho dostal objekt `{country:"sk"}` ako callback (čo nie je funkcia).

**Fix:** Správne poradie: `pick(PACKETA_API_KEY, callbackFn, { country: "sk", language: "sk" })`

---

### Bug 3 — `variableSymbol` mimo scope

**Symptóm:** TypeScript chyba `TS18004: No value exists in scope for the shorthand property 'variableSymbol'`.

**Príčina:** `variableSymbol` bol definovaný vnútri `if (iban)` bloku, ale použitý v `return NextResponse.json({ variableSymbol })` mimo bloku.

**Fix:** Definovanie pred `if (iban)` blokom.

---

*Dokument vytvorený: Máj 2026 — NextLayer Studio*
