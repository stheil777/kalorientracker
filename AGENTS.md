# Kalorientracker - Projektkontext

## Was ist das?

Mobile-first Kalorientracker fuer zwei Nutzer: Stephan und Jen.
Privates Tool, kein oeffentliches Produkt (noch nicht).
Spaeter soll daraus ein Coaching-Tool fuer Jens Kunden werden.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Supabase Auth (Email/Passwort) + Postgres
- Vercel Deployment
- USDA FoodData Central API (Lebensmittelsuche)

## Projektstruktur

```
src/
  app/
    page.tsx              # Haupt-App (Dashboard, Mahlzeiten, Favoriten, Notizen)
    layout.tsx            # Root Layout
    manifest.ts           # PWA Manifest
    api/
      food-search/route.ts  # USDA API Proxy
      delete-account/route.ts
    datenschutz/page.tsx
  lib/
    supabase.ts           # Supabase Client
    types.ts              # TypeScript Types
    date.ts               # Datums-Hilfsfunktionen
    jen-foods.ts          # Curated Lebensmittelliste
    sounds.ts             # UI Sounds
supabase/
  schema.sql              # Vollstaendiges DB-Schema
  *.sql                   # Migrations
```

## Supabase-Tabellen

- `profiles` - Nutzerprofil mit Gewicht, Groesse, Alter, Ziel, Ernaehrungsform
- `meal_entries` - Mahlzeiten pro Tag/Profil mit Kalorien + Makros
- `favorite_meals` - Gespeicherte Favoriten fuer Schnellzugriff
- `daily_notes` - Tagesnotizen (Gewicht, Training, Wasser, Schlaf, Energie)

Row Level Security ist aktiv -- alle Queries filtern auf `auth.uid()`.

## Umgebungsvariablen

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
USDA_API_KEY=...              # optional, Fallback auf DEMO_KEY
```

`.env.local` existiert lokal, `.env.example` ist die Vorlage.

## Live

- App: https://kalorientracker-cyan.vercel.app
- GitHub: https://github.com/stheil777/kalorientracker
- Push auf `main` deployed automatisch via Vercel

## Aktueller Stand (Juni 2026)

Funktioniert:
- Login/Signup mit Email
- Profil-Setup (Gewicht, Groesse, Ziel etc.)
- Automatische Kalorien-/Makro-Berechnung (Mifflin-St Jeor)
- Mahlzeiten eintragen mit USDA-Suche
- Favoriten speichern und wiederverwenden
- Tagesnotizen (Gewicht, Training, Wasser, Schlaf, Energie)
- Dashboard mit Tagesuebersicht

## Uebergabe (Stand 19.06.2026)

Dieses Projekt wurde bisher mit Claude Code gebaut. Du uebernimmst.

### Was gerade fertig geworden ist

- Security-Fixes: Auth auf API-Routes, RLS-Policies gehaertet, Account-Loeschung korrekt (auth.users)
- Datumsbug gefixt (UTC -> lokal)
- Datenschutzseite `/datenschutz` ist vollstaendig mit jen-myworld.de als URL
- Supabase DPA wurde angefragt

### Was NICHT anfassen

- `supabase/schema.sql` nicht aendern ohne Migration-SQL-Datei dazu
- `.env.local` nie committen
- Datenschutzseite (`datenschutz/page.tsx`) ist inhaltlich final -- nur Layout-Fixes
- RLS-Policies in Supabase nicht lockern

### Design-System

Die App nutzt Jens Brand: warme Erdtoene, Coral als Akzent.
CSS-Variablen sind in `globals.css` definiert (--coral, --espresso, --sand etc.).
Font: Lora (serif, Headlines) + Manrope (sans, Body).
Immer mobile-first, grosse Touch-Targets.

### Architektur-Entscheidung

Die gesamte App lebt in EINER Datei: `src/app/page.tsx`.
Das ist Absicht (MVP, schnelle Iteration). Refactoring in Komponenten ist willkommen,
aber nur wenn es die Lesbarkeit verbessert -- nicht auf Vorrat.

## Offene Aufgaben (priorisiert)

### Sofort (bevor Jen die App nutzt)

1. **Profil-Felder testen** - Nach DB-Migration pruefen ob Profildaten persistent bleiben
2. **Gesundheitsdaten-Einwilligung** - Beim ersten Login separater Einwilligungstext fuer Art. 9 DSGVO (nicht nur Datenschutz-Checkbox). Eigener Klick fuer Gesundheitsdaten.

### Naechste Features

3. **Lebensmitteldaten verbessern** - Eigene Bibliothek, bessere Portionsauswahl, Open Food Facts API
4. **UX verbessern** - Mahlzeit bearbeiten, schnellere Mengensteuerung, Datumswechsel
5. **Auswertung** - Gewichtsverlauf, Wochenkalorien, Protein-Compliance, Charts

### Spaeter (wenn Jen Kundinnen hat)

6. **Coach-Modell** - Rollen (client/coach), Kundenliste fuer Jen, Wochenreports
7. **Branding** - Auth-Mails anpassen, eigene Domain, Onboarding-Copy
8. **Rechtliches** - Impressum, AGB (Datenschutz ist fertig)

## Regeln

- Sprache im Code: Englisch (Variablen, Kommentare)
- Sprache UI: Deutsch
- Mobile-first -- grosse Touch-Targets, kein Desktop-Layout-Fokus
- Keine Breaking Changes am Supabase-Schema ohne Migration-SQL
- Neue Features als eigene Commits, nicht alles auf einmal

<!-- BEGIN:nextjs-agent-rules -->
# Next.js Hinweis

APIs und Konventionen koennen von Trainingsdaten abweichen.
Bei Unsicherheit: `node_modules/next/dist/docs/` lesen.
<!-- END:nextjs-agent-rules -->
