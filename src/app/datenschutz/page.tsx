import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – JEN Kalorientracker",
  description: "Datenschutzerklärung für den JEN Kalorientracker",
};

export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[var(--espresso)]">
      <Link
        href="/"
        className="mb-10 inline-block text-sm font-semibold text-[var(--coral)] hover:opacity-75 transition-opacity"
      >
        ← Zurück zur App
      </Link>

      <h1 className="serif mb-2 text-3xl leading-tight">Datenschutzerklärung</h1>
      <p className="mb-12 text-sm text-[var(--espresso-50)]">Stand: Juni 2026</p>

      <div className="space-y-10 text-[var(--espresso-70)] leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">1. Verantwortliche</h2>
          <p>Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
          <address className="mt-3 not-italic font-semibold text-[var(--espresso)]">
            Jennifer Heil<br />
            Wellmicher Straße 88<br />
            56346 St. Goarshausen<br />
            E-Mail: <a href="mailto:jenheil2108@gmail.com" className="text-[var(--coral)] underline underline-offset-2">jenheil2108@gmail.com</a>
          </address>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">2. Datenschutzbeauftragte/r</h2>
          <p>
            Jennifer Heil ist Einzelunternehmerin. Eine gesetzliche Pflicht zur Bestellung
            einer Datenschutzbeauftragten besteht nicht (Art. 37 DSGVO). Bei
            datenschutzrechtlichen Fragen wenden Sie sich an die oben genannte
            Kontaktadresse.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">3. Was diese App tut</h2>
          <p className="mb-3">
            Diese App dient dem persönlichen Gesundheits- und Ernährungs-Tracking im Rahmen
            eines Coaching-Verhältnisses. Folgende Daten werden erhoben und gespeichert:
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Zugangsdaten:</strong> E-Mail-Adresse, Passwort (verschlüsselt), Vorname</li>
            <li><strong>Körperdaten:</strong> Gewicht, Körpergröße, Alter, Geschlecht</li>
            <li><strong>Ernährungsdaten:</strong> Kalorienaufnahme, Makronährstoffe (Protein, Kohlenhydrate, Fett)</li>
            <li><strong>Aktivitätsdaten:</strong> Trainingsaktivität, -dauer, Kalorienverbrauch</li>
            <li><strong>Befindlichkeitsdaten:</strong> Schlafqualität, Stimmung, Energielevel, Sättigungsgefühl, Gelüste</li>
            <li><strong>Freitextnotizen:</strong> persönliche Tagesnotizen</li>
          </ul>
          <p className="mt-4 rounded-lg bg-[rgba(240,107,93,0.08)] p-4 text-sm">
            <strong>Wichtig:</strong> Bei einem Großteil dieser Daten handelt es sich um
            <strong> Gesundheitsdaten</strong> im Sinne von Art. 4 Nr. 15 DSGVO. Diese
            genießen nach Art. 9 DSGVO besonderen Schutz und werden ausschließlich auf
            Basis Ihrer ausdrücklichen Einwilligung verarbeitet.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">4. Rechtsgrundlagen</h2>

          <h3 className="mt-4 mb-2 font-semibold text-[var(--espresso)]">4.1 Zugangsdaten</h3>
          <p>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) — die Registrierung ist
            Voraussetzung für die Nutzung der App im Rahmen des Coaching-Vertrags.
          </p>

          <h3 className="mt-4 mb-2 font-semibold text-[var(--espresso)]">4.2 Gesundheits- und Körperdaten</h3>
          <p>
            Art. 9 Abs. 2 lit. a DSGVO i. V. m. Art. 6 Abs. 1 lit. a DSGVO —
            <strong> ausdrückliche Einwilligung</strong> der betroffenen Person. Die
            Einwilligung wird beim ersten App-Login eingeholt und dokumentiert. Sie kann
            jederzeit widerrufen werden (siehe Abschnitt 10).
          </p>

          <h3 className="mt-4 mb-2 font-semibold text-[var(--espresso)]">4.3 Coach-Zugriff</h3>
          <p>
            Ihre Trainerin Jennifer Heil hat Zugriff auf Ihre Daten, um Sie im Coaching
            individuell zu begleiten. Grundlage: Art. 9 Abs. 2 lit. a DSGVO. Der Zugriff
            ist auf Jennifer Heil beschränkt. Eine Weitergabe an Dritte findet nicht statt.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">5. Zwecke der Datenverarbeitung</h2>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Bereitstellung der App-Funktionen</li>
            <li>Coaching und individuelle Begleitung durch Ihre Coach</li>
            <li>Technischer Betrieb (Authentifizierung, Sicherheit, Fehlerbehebung)</li>
          </ol>
          <p className="mt-3 text-sm">
            Keine Weitergabe zu Werbezwecken, kein Datenverkauf, keine automatisierten
            Entscheidungen.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">6. Dienstleister (Auftragsverarbeitung)</h2>

          <h3 className="mt-4 mb-2 font-semibold text-[var(--espresso)]">6.1 Supabase (Datenbank und Authentifizierung)</h3>
          <p className="text-sm mb-2">
            Supabase Inc., Singapur. Serverstandort: EU-Region (Frankfurt, AWS eu-central-1).
            Drittlandtransfer auf Basis der EU-Standardvertragsklauseln (Beschluss EU 2021/914).
          </p>
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
            className="text-sm text-[var(--coral)] underline underline-offset-2">
            supabase.com/privacy
          </a>

          <h3 className="mt-6 mb-2 font-semibold text-[var(--espresso)]">6.2 Vercel (Hosting)</h3>
          <p className="text-sm mb-2">
            Vercel Inc., San Francisco, USA. Primäre Verarbeitung in der EU. Drittlandtransfer
            auf Basis der EU-Standardvertragsklauseln (DPA mit Vercel).
          </p>
          <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer"
            className="text-sm text-[var(--coral)] underline underline-offset-2">
            vercel.com/legal/dpa
          </a>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">7. Speicherdauer</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--espresso-14)]">
                  <th className="py-2 pr-4 text-left font-semibold text-[var(--espresso)]">Datenkategorie</th>
                  <th className="py-2 text-left font-semibold text-[var(--espresso)]">Speicherdauer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--espresso-08)]">
                <tr>
                  <td className="py-2.5 pr-4">Account-Daten</td>
                  <td className="py-2.5">Bis zur Account-Löschung</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Gesundheits- und Körperdaten</td>
                  <td className="py-2.5">Bis zur Account-Löschung oder Widerruf</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Freitextnotizen</td>
                  <td className="py-2.5">Bis zur Account-Löschung oder auf Anfrage</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Technische Logs</td>
                  <td className="py-2.5">Max. 30 Tage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">8. Technische Sicherheit (Art. 32 DSGVO)</h2>
          <ul className="space-y-1.5 list-disc list-inside text-sm">
            <li>Verschlüsselte Übertragung via HTTPS/TLS</li>
            <li>Passwort-Hashing durch Supabase Auth (bcrypt)</li>
            <li>Row-Level Security — jede Nutzerin sieht nur ihre eigenen Daten</li>
            <li>Coach-Zugriff nur für explizit autorisierte Personen</li>
            <li>Datenbankserver in Frankfurt (EU)</li>
          </ul>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">9. Besondere Hinweise zu Gesundheitsdaten</h2>
          <p className="mb-3">
            Ihre Körper- und Befindlichkeitsdaten sind <strong>besondere Kategorien
            personenbezogener Daten</strong> (Art. 9 Abs. 1 DSGVO). Deren Verarbeitung
            erfolgt nur mit Ihrer ausdrücklichen Einwilligung.
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-sm">
            <li>Sie entscheiden frei, welche Daten Sie eintragen.</li>
            <li>Sie können Ihre Einwilligung jederzeit widerrufen — ohne Nachteile, ohne Angabe von Gründen.</li>
            <li>Nach Widerruf werden Ihre Gesundheitsdaten gelöscht.</li>
          </ul>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">10. Ihre Rechte</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--espresso-14)]">
                  <th className="py-2 pr-4 text-left font-semibold text-[var(--espresso)]">Recht</th>
                  <th className="py-2 text-left font-semibold text-[var(--espresso)]">Was das bedeutet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--espresso-08)]">
                {[
                  ["Auskunft (Art. 15)", "Welche Daten werden über mich gespeichert?"],
                  ["Berichtigung (Art. 16)", "Unrichtige Daten korrigieren lassen"],
                  ["Löschung (Art. 17)", "Löschung aller Ihrer Daten verlangen"],
                  ["Einschränkung (Art. 18)", "Verarbeitung vorübergehend sperren"],
                  ["Datenübertragbarkeit (Art. 20)", "Daten in maschinenlesbarem Format erhalten"],
                  ["Widerruf der Einwilligung (Art. 7 Abs. 3)", "Einwilligung jederzeit widerrufen"],
                ].map(([right, desc]) => (
                  <tr key={right}>
                    <td className="py-2.5 pr-4 font-medium">{right}</td>
                    <td className="py-2.5">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            Kontakt:{" "}
            <a href="mailto:jenheil2108@gmail.com" className="text-[var(--coral)] underline underline-offset-2">
              jenheil2108@gmail.com
            </a>
            {" "}— Bearbeitung innerhalb eines Monats (Art. 12 Abs. 3 DSGVO).
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">11. Beschwerderecht (Art. 77 DSGVO)</h2>
          <p className="text-sm mb-2">
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          </p>
          <p className="text-sm mb-1">
            <strong>Für Deutschland:</strong>{" "}
            <a href="https://www.bfdi.bund.de/DE/Service/Anschriften/anschriften.html"
              target="_blank" rel="noopener noreferrer"
              className="text-[var(--coral)] underline underline-offset-2">
              Zuständige Landesbehörde (bfdi.bund.de)
            </a>
          </p>
          <p className="text-sm">
            <strong>Für Portugal:</strong> Comissão Nacional de Proteção de Dados (CNPD),{" "}
            <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer"
              className="text-[var(--coral)] underline underline-offset-2">
              cnpd.pt
            </a>
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">12. Cookies</h2>
          <p>
            Diese App verwendet ausschließlich <strong>technisch notwendige Cookies</strong>{" "}
            für die Session-Verwaltung. Es werden keine Analyse-, Werbe- oder
            Tracking-Cookies eingesetzt. Ein Cookie-Banner ist daher nicht erforderlich
            (§ 25 Abs. 2 Nr. 2 TDDDG).
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">13. Keine automatisierten Entscheidungen</h2>
          <p>
            Es findet kein Profiling und keine automatisierte Entscheidungsfindung im Sinne
            von Art. 22 DSGVO statt.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-[var(--espresso)]">14. Änderungen</h2>
          <p>
            Bei wesentlichen Änderungen dieser Datenschutzerklärung werden Sie per E-Mail
            oder beim nächsten Login informiert.
          </p>
        </section>

      </div>

      <div className="mt-16 border-t border-[var(--espresso-14)] pt-8 text-center">
        <p className="serif mb-4 text-lg italic text-[var(--coral)]">
          Dein Körper kennt die Antwort.
        </p>
        <Link
          href="/"
          className="text-sm text-[var(--espresso-50)] hover:text-[var(--coral)] transition-colors"
        >
          Zurück zur App
        </Link>
      </div>
    </main>
  );
}
