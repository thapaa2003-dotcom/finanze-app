# ConFin — Persoonlijk Financieel Dashboard

Premium financieel dashboard voor Belgische zelfstandigen in bijberoep/hoofdberoep. React + Vite + Tailwind + Recharts + Supabase. PWA, installeerbaar op iPhone en Android, realtime sync tussen toestellen.

## Wat zit erin

- **Auth**: e-mail + wachtwoord, 2FA via authenticator-app, "ingelogd blijven" toggle
- **Onboarding**: vermogenssnapshot, vaste kosten, overlevingsbudget, spaardoelen
- **Transacties**: Belfius CSV import, Dexxter CSV import, manuele invoer, verwachte inkomsten pipeline, bewerkbare categorisatieregels, CSV export
- **Dashboard**: netto vermogen, gezondheidsscore, cashflow forecast 90 dagen met gevarenzones, heatmap, gedragsanalyse, peer benchmark, netto uurloon
- **Zelfstandige**: sociale bijdragen 20,5%, belastingprovisie 28%, BTW-grens tracker (€25.000), VAPZ/POZ, kwartaalkalender, beroepskosten, OVB commissietracker, slechte-maand-simulator
- **Doelen**: noodfonds gauge (6× vaste kosten), spaardoelen met slimme allocatie, cash vs lening vs renting advies, confetti
- **Rapporten**: maandrapport met highlights, PDF download
- **Extra**: dark/light mode, alerts, realtime sync, offline PWA

## Setup (eenmalig, ±15 minuten)

### 1. Supabase project

1. Ga naar [supabase.com](https://supabase.com), maak gratis een account en een nieuw project (regio: West EU).
2. Open in het project **SQL Editor** > New query.
3. Plak de volledige inhoud van `supabase/schema.sql` en klik **Run**.
4. Ga naar **Authentication > Providers > Email** en zet "Confirm email" uit (of laat aan als je e-mailbevestiging wil).
5. Ga naar **Project Settings > API** en kopieer:
   - Project URL
   - anon public key

### 2. Lokaal testen (optioneel)

```bash
npm install
cp .env.example .env
# vul in .env je Supabase URL en anon key in
npm run dev
```

### 3. Deploy naar Vercel

1. Push deze map naar een GitHub repo (privé is prima).
2. Ga naar [vercel.com](https://vercel.com), **Add New Project**, importeer de repo.
3. Framework preset: **Vite** (wordt automatisch gedetecteerd).
4. Voeg onder **Environment Variables** toe:
   - `REACT_APP_SUPABASE_URL` = jouw Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = jouw anon key
5. Deploy. Klaar.

### 4. Eerste login

1. Open de Vercel URL, klik **Registreren** en maak je account aan.
2. Doorloop de onboarding (skippable, alles is later aanpasbaar via Instellingen).
3. Activeer 2FA via **Meer > Beveiliging**: scan de QR-code met Google Authenticator of Authy.

### 5. Installeren op je GSM (PWA)

**iPhone**: open de site in Safari > deelknop > **Zet op beginscherm**.
**Android**: open in Chrome > menu > **App installeren**.

De app synct realtime: voeg een transactie toe op je PC en ze verschijnt meteen op je GSM.

## CSV imports

**Belfius**: exporteer je rekeninguittreksels als CSV (puntkomma-gescheiden). De app herkent de kolommen datum, omschrijving, bedrag, saldo en tegenrekening automatisch en filtert dubbels.

**Dexxter**: exporteer je facturen/inkomsten als CSV en upload via Transacties > Dexxter.

## Disclaimer

De fiscale berekeningen (sociale bijdragen 20,5%, belastingprovisie 28%, BTW-grens, VAPZ-plafond) zijn vuistregels ter indicatie en geen fiscaal advies. Controleer actuele drempels en percentages met je boekhouder of sociaal verzekeringsfonds.
