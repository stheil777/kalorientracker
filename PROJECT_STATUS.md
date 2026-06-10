# Kalorientracker - Projektstatus

Stand: 10.06.2026

## Links

- Live-App: https://kalorientracker-cyan.vercel.app
- GitHub: https://github.com/stheil777/kalorientracker
- Supabase-Projekt: `zabhwboiynwjslvrywqt`

## Aktueller Stand

Die App ist als klickbarer MVP live auf Vercel.

Umgesetzt:

- Next.js App Router mit TypeScript und Tailwind CSS
- Mobile-first UI im Stil der Jen-Website
- Supabase Auth mit E-Mail/Passwort
- Supabase Datenbank mit Row Level Security
- Vercel Production Deployment
- GitHub Repo verbunden mit Vercel
- Supabase Redirect URLs fuer Localhost und Vercel gesetzt

## Funktionen

- Account erstellen und einloggen
- Zwei Profile im Account: Stephan und Jen
- Einmaliges Profil-Setup pro Profil:
  - Gewicht
  - Groesse
  - Alter
  - Koerper/Geschlecht
  - Aktivitaetslevel
  - Ziel: Abnehmen, Halten, Aufbauen
  - Ernaehrungsform
- Automatische Zielberechnung:
  - Kalorien
  - Protein
  - Carbs
  - Fett
- Formel:
  - Mifflin-St Jeor fuer Grundumsatz
  - Aktivitaetsfaktor
  - Zielanpassung
  - Makroverteilung je nach Ziel/Ernaehrungsform
- Dashboard:
  - heutige Kalorien/Makros
  - verbleibende Ziele
- Mahlzeiten eintragen:
  - Datum intern aktuell auf heute
  - Profil
  - Mahlzeittyp
  - Lebensmittel
  - Menge
  - Kalorien
  - Protein
  - Carbs
  - Fett
- Favoriten:
  - Mahlzeit als Favorit speichern
  - Favorit mit einem Tap wieder hinzufuegen
  - Favorit entfernen
- Tagesnotizen:
  - Gewicht
  - Training ja/nein
  - Wasser
  - Schlafqualitaet
  - Energielevel
  - freie Notizen

## Supabase

Tabellen:

- `profiles`
- `meal_entries`
- `favorite_meals`
- `daily_notes`

SQL-Dateien:

- Vollschema: `supabase/schema.sql`
- Migration fuer Profil-Setup: `supabase/2026-06-10-profile-setup-migration.sql`

Wichtig:

- `.env.local` ist lokal vorhanden, wird aber nicht committed.
- `.env.example` ist die Vorlage fuer neue Umgebungen.
- In Vercel sind gesetzt:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Produktentscheidungen

Aktuell:

- Ein Supabase-Account kann beide Profile sehen: Stephan und Jen.
- Das ist fuer den privaten Test okay.
- Kein Partner-Profil- oder Kundenmodell eingebaut.

Spaeter moeglich:

- Kundin sieht nur eigenes Profil.
- Jen bekommt Coach/Admin-Ansicht.
- Jen kann Kundendaten lesen, kommentieren oder auswerten.
- Rollenmodell mit `client` und `coach`.

## Bekannte Grenzen

- Noch keine echte Lebensmitteldatenbank.
- Lebensmittelwerte werden manuell eingegeben.
- Favoriten sind die erste pragmatische Loesung.
- Keine Barcode-Funktion.
- Keine Wochen-/Monatsauswertung.
- Keine Charts.
- Keine Datenschutz-/Impressum-/AGB-Seiten.
- Auth-Mails sind aktuell Supabase-Standardmails.

## Next Steps

### 1. Lebensmitteldaten verbessern

Kurzfristig:

- Eigene Lebensmittelbibliothek bauen
- Haeufige Lebensmittel sauber hinterlegen
- Portionen schneller auswahlen

Danach:

- API pruefen und anbinden
  - Open Food Facts fuer Barcodes/verpackte Produkte
  - USDA FoodData Central fuer Grundnahrungsmittel
  - Alternativ FatSecret/andere Anbieter

### 2. UX verbessern

- Mahlzeit bearbeiten statt nur loeschen
- Schnellere Mengensteuerung
- Gestern/heute wechseln ohne grosses Datumfeld
- Bessere leere Zustaende
- Bessere mobile Sticky-Actions

### 3. Auswertung

- Gewichtsentwicklung
- Wochenkalorien
- Protein-Compliance
- Trainingstage
- Wasser/Schlaf/Energie-Trends

### 4. Produktmodell fuer Jen

Wenn daraus ein echtes Jen-Produkt wird:

- Rollen:
  - Kunde/Kundin
  - Coach/Admin Jen
- Kundenliste fuer Jen
- Einzelprofil pro Kunde
- Freigaben/Datenschutz
- Notizen/Feedback von Jen
- Export oder Wochenreport

### 5. Branding und Kommunikation

- Auth-Mails im Jen-Stil anpassen
- Spaeter eigene Absenderdomain, z.B. `app@jen-body-code.de`
- Landing-/Info-Seiten fuer echtes Produkt
- Onboarding-Copy schaerfen

### 6. Rechtliches und Betrieb

Vor echten Kunden klaeren:

- Datenschutz
- Impressum
- AGB/Nutzungsbedingungen
- Hinweis: keine medizinische Beratung
- Datenloeschung/Accountloeschung
- Supabase/Vercel Kosten und Limits

## Lokale Entwicklung

```bash
cd /Users/stheil/Desktop/Kalorientracker
npm run dev
```

Dann oeffnen:

```text
http://localhost:3000
```

Checks:

```bash
npm run lint
npm run build
```

## Deployment

Push auf `main` geht zu GitHub.

Vercel ist mit dem GitHub-Repo verbunden. Production:

```text
https://kalorientracker-cyan.vercel.app
```
