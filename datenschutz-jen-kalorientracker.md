# Datenschutzerklärung — JEN Kalorientracker

**Stand: Juni 2026**

---

## Kurzübersicht — Was jetzt zu tun ist

**Das Fundament ist gut** — Supabase + Vercel haben beide EU-SCCs und EU-Serverstandorte. Nicht das Problem.

**Pflicht vor erster Klientin:**
1. Platzhalter in Abschnitt 1 ausfüllen (Jens Adresse, E-Mail, Website)
2. Supabase DPA unterschreiben — Supabase Dashboard → Organization → Settings → Legal → DPA (kostenlos)
3. Vercel DPA aktivieren — Vercel Dashboard → Settings → Legal (kostenlos)
4. In der App: separater Einwilligungstext für Gesundheitsdaten beim ersten Login — die jetzige Datenschutz-Checkbox reicht nicht für Art. 9 Daten (Gewicht, Kalorien, Stimmung etc.)
5. Kurz von einem deutschen Anwalt prüfen lassen — ca. 150–300 EUR, bei Gesundheitsdaten wirklich sinnvoll

**Kein Cookie-Banner nötig** — die App setzt nur technisch notwendige Session-Cookies (§ 25 Abs. 2 Nr. 2 TDDDG).

**Coach-Zugriff (Phase 2):** Sobald Jen das Coach-Dashboard bekommt und Klientinnen-Daten einsehen kann, braucht es einen zusätzlichen, separaten Einwilligungstext dafür.

---

> **TODO vor Go-Live:** Platzhalter in Abschnitt 1 ausfüllen (Adresse, E-Mail, Website).

---

## 1. Verantwortliche

Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

**Jennifer Heil**
Wellmicher Straße 88
56346 St. Goarshausen
E-Mail: jenheil2108@gmail.com
Website: noch nicht vergeben

---

## 2. Datenschutzbeauftragte/r

Jennifer Heil ist Einzelunternehmerin mit Sitz in Portugal und verarbeitet Daten im Rahmen ihrer Coaching-Tätigkeit. Eine gesetzliche Pflicht zur Bestellung einer Datenschutzbeauftragten besteht derzeit nicht (Art. 37 DSGVO). Bei datenschutzrechtlichen Fragen wenden Sie sich direkt an die oben genannte Kontaktadresse.

---

## 3. Was diese App tut — Übersicht der Verarbeitungen

Diese App dient dem persönlichen Gesundheits- und Ernährungs-Tracking im Rahmen eines Coaching-Verhältnisses. Die App erhebt und speichert:

- **Zugangsdaten:** E-Mail-Adresse, Passwort (verschlüsselt), Vorname
- **Körperdaten:** Gewicht, Körpergröße, Alter, Geschlecht
- **Ernährungsdaten:** Kalorienaufnahme, Makronährstoffe (Proteine, Kohlenhydrate, Fette)
- **Aktivitätsdaten:** Trainingsaktivität, -dauer, Kalorienverbrauch
- **Befindlichkeitsdaten:** Schlafqualität, Stimmung, Energielevel, Sättigungsgefühl, Gelüste/Cravings
- **Freitextnotizen:** persönliche Tagesnotizen

**Wichtiger Hinweis:** Bei einem Großteil dieser Daten handelt es sich um **Gesundheitsdaten** im Sinne von Art. 4 Nr. 15 DSGVO. Diese genießen nach Art. 9 DSGVO besonderen Schutz. Die Verarbeitung erfolgt ausschließlich auf der Grundlage Ihrer ausdrücklichen Einwilligung.

---

## 4. Rechtsgrundlagen der Datenverarbeitung

### 4.1 Zugangsdaten (E-Mail, Vorname, Passwort)

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) — die Registrierung ist Voraussetzung für die Nutzung der App im Rahmen des Coaching-Vertrags.

### 4.2 Gesundheits- und Körperdaten

**Rechtsgrundlage:** Art. 9 Abs. 2 lit. a DSGVO in Verbindung mit Art. 6 Abs. 1 lit. a DSGVO — **ausdrückliche Einwilligung** der betroffenen Person.

Dazu gehören: Gewicht, Körpergröße, Alter, Geschlecht, Kalorien, Makronährstoffe, Trainingsaktivität, Schlafqualität, Stimmung, Energielevel, Sättigung, Gelüste sowie Freitextnotizen, soweit diese Gesundheitsbezug aufweisen.

Die Einwilligung wird beim ersten App-Login eingeholt und dokumentiert. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen (siehe Abschnitt 10).

### 4.3 Coach-Zugriff auf Ihre Daten

Ihre Trainerin/Coach (Jennifer Heil) hat Zugriff auf Ihre erfassten Daten, um Sie im Rahmen des Coaching-Prozesses individuell zu begleiten, Ihre Fortschritte auszuwerten und Empfehlungen anzupassen.

**Rechtsgrundlage:** Art. 9 Abs. 2 lit. a DSGVO — Ihre ausdrückliche Einwilligung in diesen Zugriff wird gesondert eingeholt.

Der Zugriff ist auf Jennifer Heil beschränkt. Eine Weitergabe an Dritte findet nicht statt.

---

## 5. Zwecke der Datenverarbeitung

Ihre Daten werden ausschließlich für folgende Zwecke verarbeitet:

1. **Bereitstellung der App-Funktionen** — Erfassung und Anzeige Ihrer Tracking-Daten
2. **Coaching und Betreuung** — Auswertung Ihrer Daten durch Ihre Coach zur individuellen Begleitung
3. **Technischer Betrieb** — Authentifizierung, Datensicherheit, Fehlerbehebung
4. Keine Weitergabe zu Werbezwecken, kein Verkauf von Daten, keine automatisierten Entscheidungen.

---

## 6. Empfänger und Dienstleister (Auftragsverarbeitung)

Für den Betrieb der App werden folgende Dienstleister eingesetzt. Mit allen besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO:

### 6.1 Supabase (Datenbank und Authentifizierung)

**Anbieter:** Supabase Inc., 970 Toa Payoh North, #07-04, Singapur 318992
**Funktion:** Speicherung aller App-Daten (Profil, Gesundheitsdaten, Notizen), Login-Authentifizierung
**Serverstandort:** EU-Region (Frankfurt, AWS eu-central-1)
**Drittlandtransfer:** Supabase Inc. hat seinen Hauptsitz außerhalb der EU. Grundlage für den Datentransfer sind die **Standardvertragsklauseln der EU-Kommission** gemäß Beschluss (EU) 2021/914 (SCCs), die zwischen Supabase und der Verantwortlichen vereinbart wurden.
Weitere Informationen: https://supabase.com/privacy

### 6.2 Vercel Inc. (Hosting und App-Auslieferung)

**Anbieter:** Vercel Inc., 340 Pine Street Suite 701, San Francisco, CA 94104, USA
**Funktion:** Hosting und Auslieferung der Web-App über ein globales CDN
**Serverstandort:** Primäre Verarbeitung in der EU; Vercel betreibt Edge-Server in Europa.
**Drittlandtransfer:** Vercel Inc. ist ein US-amerikanisches Unternehmen. Grundlage für den Datentransfer sind die **Standardvertragsklauseln der EU-Kommission** gemäß Beschluss (EU) 2021/914, vereinbart im Data Processing Addendum (DPA) mit Vercel.
Weitere Informationen: https://vercel.com/legal/dpa

**Hinweis zu Drittlandtransfers (Art. 44–49 DSGVO):** Beide Dienstleister sind US-amerikanische Unternehmen. In den USA besteht kein mit der EU vergleichbares Datenschutzniveau. Die EU-Standardvertragsklauseln sind das vertraglich vereinbarte Schutzinstrument. Ergänzend wurden technische Maßnahmen (Verschlüsselung, EU-Serverstandorte) vereinbart.

---

## 7. Speicherdauer

| Datenkategorie | Speicherdauer |
|---|---|
| Account-Daten (E-Mail, Vorname) | Bis zur Löschung des Accounts |
| Gesundheits- und Körperdaten | Bis zur Löschung des Accounts oder bis zum Widerruf der Einwilligung |
| Freitextnotizen | Bis zur Löschung des Accounts oder auf Anfrage früher |
| Technische Logs (Authentifizierung) | Max. 30 Tage, danach automatische Löschung |

Nach Beendigung des Coaching-Verhältnisses und Löschung des Accounts werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

---

## 8. Technische und organisatorische Sicherheitsmaßnahmen (Art. 32 DSGVO)

- **Verschlüsselte Übertragung** aller Daten via HTTPS/TLS
- **Passwort-Hashing** durch Supabase Auth (bcrypt)
- **Datenbankzugriffskontrolle** durch Row-Level Security (RLS) — jede Nutzerin sieht nur ihre eigenen Daten
- **Coach-Zugriff** nur für explizit autorisierte Personen
- **EU-Datenspeicherung** — Datenbankserver in Frankfurt (EU)

---

## 9. Besondere Hinweise zu Gesundheitsdaten (Art. 9 DSGVO)

Die von Ihnen erfassten Körper- und Befindlichkeitsdaten sind **besondere Kategorien personenbezogener Daten** gemäß Art. 9 Abs. 1 DSGVO. Deren Verarbeitung ist nur auf Basis Ihrer **ausdrücklichen Einwilligung** (Art. 9 Abs. 2 lit. a DSGVO) zulässig.

Das bedeutet konkret:

- Sie entscheiden frei, welche Daten Sie eintragen.
- Sie können Ihre Einwilligung jederzeit widerrufen — ohne Nachteile, ohne Angabe von Gründen.
- Nach Widerruf werden Ihre Gesundheitsdaten gelöscht.

---

## 10. Ihre Rechte als betroffene Person

| Recht | Rechtsgrundlage | Was das bedeutet |
|---|---|---|
| **Auskunft** | Art. 15 DSGVO | Welche Daten werden über mich gespeichert? |
| **Berichtigung** | Art. 16 DSGVO | Unrichtige Daten korrigieren lassen |
| **Löschung** | Art. 17 DSGVO | Löschung aller Ihrer Daten verlangen |
| **Einschränkung** | Art. 18 DSGVO | Verarbeitung vorübergehend sperren lassen |
| **Datenübertragbarkeit** | Art. 20 DSGVO | Ihre Daten in maschinenlesbarem Format erhalten |
| **Widerspruch** | Art. 21 DSGVO | Der Verarbeitung widersprechen |
| **Widerruf der Einwilligung** | Art. 7 Abs. 3 DSGVO | Einwilligung jederzeit widerrufen |

**Kontakt:** Per E-Mail an jenheil2108@gmail.com. Bearbeitung innerhalb eines Monats (Art. 12 Abs. 3 DSGVO).

---

## 11. Beschwerderecht bei der Aufsichtsbehörde (Art. 77 DSGVO)

Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.

**Für Deutschland (DACH-Nutzerinnen):** Die Datenschutzbehörde des jeweiligen Bundeslandes.
Liste: https://www.bfdi.bund.de/DE/Service/Anschriften/anschriften.html

**Für Portugal (Sitz der Verantwortlichen):**
Comissão Nacional de Proteção de Dados (CNPD)
Av. D. Carlos I, 134 – 1.º | 1200-651 Lisboa
https://www.cnpd.pt

---

## 12. Cookies und lokale Speicherung

Diese App verwendet ausschließlich **technisch notwendige Cookies** für die Session-Verwaltung (Login-Status). Es werden keine Analyse-, Werbe- oder Tracking-Cookies eingesetzt.

Ein Cookie-Banner ist daher nicht erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).

---

## 13. Keine automatisierten Entscheidungen

Es findet kein Profiling und keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO statt.

---

## 14. Änderungen dieser Datenschutzerklärung

Bei wesentlichen Änderungen werden Sie per E-Mail oder beim nächsten Login informiert.

**Stand: Juni 2026**

---

---

# Offene Punkte — vor Go-Live erledigen

1. ~~**Platzhalter ausfüllen**~~ — ✅ erledigt: Wellmicher Straße 88, 56346 St. Goarshausen, jenheil2108@gmail.com (Website folgt)
2. **Supabase-Region prüfen** — Projekt auf `eu-central-1` (Frankfurt) stellen, dann stimmt Abschnitt 6.1
3. **AVV mit Supabase abschließen** — Supabase Dashboard → Organization → Settings → Legal → DPA herunterladen und unterzeichnen
4. **AVV mit Vercel abschließen** — Vercel Dashboard → Settings → Legal → DPA aktivieren
5. **Gesundheitsdaten-Einwilligung in App** — beim ersten Login separater, expliziter Einwilligungstext (nicht nur Datenschutz-Checkbox) — eigener Klick-Punkt für Art. 9 Daten
6. **Coach-Zugriff separat einwilligen** — sobald Coach-Dashboard live geht, zusätzlicher Einwilligungstext dafür
7. **Von einem deutschen Anwalt kurz prüfen lassen** — ca. 1-2h Beratung, ~150-300 EUR — bei Gesundheitsdaten empfehlenswert

---

# Warum das alles?

Gesundheitsdaten (Gewicht, Kalorien, Stimmung, Schlaf) sind nach DSGVO Art. 9 die **sensibelste Datenkategorie** — gleichgestellt mit Krankenakten. Jede App die damit arbeitet braucht:
- Ausdrückliche Einwilligung (nicht nur "Ich stimme AGB zu")
- Klare Benennung aller Verarbeiter (Supabase, Vercel)
- Dokumentierten Umgang mit US-Transfers (SCCs)
- Löschkonzept

Supabase und Vercel sind beide solide Anbieter mit EU-SCCs und EU-Serveroptionen — das Fundament ist gut. Es geht nur darum, das sauber zu dokumentieren.
