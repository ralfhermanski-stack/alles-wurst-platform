/**
 * Seed: Starter-FAQ-Einträge für die Wissensdatenbank (Status: draft).
 * Öffentlich erst nach Admin-Freigabe (status → published).
 *
 * Usage: npx tsx scripts/seed-knowledge-base-starter-faqs.ts
 */

import { prisma } from "../lib/db/prisma";
import { ensureDefaultKnowledgeBaseCategories } from "../lib/knowledge-base/knowledge-base-service";

type StarterFaq = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  categorySlug: string;
  keywords: string[];
  sortOrder: number;
};

const STARTER_FAQS: StarterFaq[] = [
  {
    slug: "beta-start-was-kann-ich-tun",
    title: "Als Beta-Tester:in — womit fange ich an?",
    summary:
      "Nach der Einladung siehst du Betatest-Aufträge und kannst Werkstatt sowie Akademie schon ausprobieren.",
    content: `Willkommen im Beta-Test von Alles-Wurst.

So kommst du am schnellsten rein:

1. Öffne Mein Bereich → Betatest und schau, ob bereits Aufträge für dich hinterlegt sind.
2. Bestätige deine E-Mail-Adresse (Banner oben), damit wir dich erreichen können.
3. Probiere die Werkstatt aus (z. B. Salzrechner oder Rezeptgenerator).
4. Schau dir den Kurskatalog unter Akademie → Kurse an.

Du musst nicht warten, bis Aufträge da sind — die Plattform ist zum Ausprobieren da. Wenn etwas unklar ist, schreib uns über Support im Mein-Bereich.`,
    categorySlug: "sonstiges",
    keywords: ["beta", "betatest", "einstieg", "starten", "auftrag"],
    sortOrder: 10,
  },
  {
    slug: "registrierung-und-anmeldung",
    title: "Wie registriere und melde ich mich an?",
    summary:
      "Registrierung mit E-Mail und Passwort; Anmeldung unter /anmelden. Mit Einladungslink startest du den Beta-Zugang.",
    content: `Registrierung
- Gehe zu Registrieren und fülle die Pflichtfelder aus.
- Nach dem Absenden bist du eingeloggt. Bitte bestätige danach deine E-Mail.

Anmeldung
- Unter Anmelden mit E-Mail und Passwort.
- Passwort vergessen? Nutze den Link „Passwort vergessen“ auf der Anmeldeseite.

Beta-Einladung
- Wenn du einen Einladungslink erhalten hast, öffne diesen zuerst. Darüber erhältst du den Beta-Zugang (Wartungs-Bypass) und landest im richtigen Einstieg.`,
    categorySlug: "konto-registrierung",
    keywords: ["registrieren", "anmelden", "login", "einladung", "konto"],
    sortOrder: 20,
  },
  {
    slug: "e-mail-adresse-bestaetigen",
    title: "Warum muss ich meine E-Mail bestätigen — und wie geht das?",
    summary:
      "Ohne Bestätigung kannst du browsen, aber wichtige Hinweise erreichen dich ggf. nicht. Link erneut senden geht über den Banner.",
    content: `Nach der Registrierung senden wir einen Bestätigungslink an deine E-Mail-Adresse.

So bestätigst du:
1. Öffne die E-Mail von Alles-Wurst und klicke den Link.
2. Wenn die Mail fehlt: prüfe Spam/Junk.
3. Im gelben Banner oben kannst du „Link erneut senden“ wählen oder die Hilfeseite zur E-Mail-Bestätigung öffnen.

Du kannst die Seite parallel schon nutzen. Die Bestätigung hilft uns, dich bei Beta-Aufträgen, Support und wichtigen Infos zu erreichen.`,
    categorySlug: "konto-registrierung",
    keywords: ["email", "e-mail", "bestätigen", "verifizieren", "banner"],
    sortOrder: 30,
  },
  {
    slug: "mein-bereich-uebersicht",
    title: "Was finde ich im Mein-Bereich?",
    summary:
      "Dein persönlicher Bereich: Kurse, Bestellungen, Nachrichten, Support, Mitgliedschaft und bei Beta auch die Testaufträge.",
    content: `Im Mein-Bereich verwaltest du dein Konto und deine Aktivitäten:

- Übersicht: Profil, Schnellzugriffe, Mitgliedschaft
- Meine Kurse: gebuchte Kurse und Lernfortschritt
- Bestellungen: Käufe und Belege
- Nachrichten: Systemhinweise
- Support: Tickets erstellen und Antworten lesen
- Mitgliedschaft: Status und Verwaltung
- Betatest (nur Beta): deine Testaufträge

Von hier aus erreichst du auch Werkstatt und Kurskatalog über die Schnelllinks.`,
    categorySlug: "konto-registrierung",
    keywords: ["mein bereich", "dashboard", "profil", "übersicht"],
    sortOrder: 40,
  },
  {
    slug: "werkstatt-welche-tools",
    title: "Welche Werkstatt-Tools gibt es — und wer darf was nutzen?",
    summary:
      "Manche Tools sind frei nutzbar, andere gehören zu Club-Stufen. Die Werkstatt-Startseite zeigt dir die verfügbaren Rechner.",
    content: `In der Werkstatt findest du praktische Tools rund um Rezeptur und Produktion, zum Beispiel:

- Salzrechner (häufig frei / für eingeloggte Nutzer nutzbar)
- Rezeptgenerator
- Rezeptdatenbank
- Lakerechner und Marinaden-Generator (je nach Mitgliedsstufe)
- Produktempfehlungen

Wenn ein Tool „gesperrt“ wirkt oder dich zurück zur Werkstatt schickt: oft fehlt die passende Mitgliedsstufe. Schau unter Mitgliedschaft nach den Club-Stufen oder öffne den Support, wenn du denkst, dass das ein Fehler ist.

Tipp für Beta: Starte mit Salzrechner und Rezeptgenerator — dort kannst du schnell Feedback geben.`,
    categorySlug: "rezeptgenerator",
    keywords: ["werkstatt", "tools", "rechte", "freigabe", "club"],
    sortOrder: 50,
  },
  {
    slug: "salzrechner-nutzen",
    title: "Wie nutze ich den Salzrechner?",
    summary:
      "Unter Werkstatt → Salzrechner berechnest du Salz- und Nitritmengen für deine Charge.",
    content: `Pfad: Werkstatt → Salzrechner

1. Gib die Fleisch- bzw. Brätmenge ein.
2. Wähle die gewünschten Salz-/Zusatzstoff-Vorgaben.
3. Übernimm die berechneten Mengen in deine Rezeptur.

Der Salzrechner ist ein Schnelltool für den Alltag. Für vollständige Rezepte inkl. Gewürzen und Schritten eignet sich der Rezeptgenerator besser.`,
    categorySlug: "salzrechner",
    keywords: ["salz", "salzrechner", "nitrit", "werkstatt"],
    sortOrder: 60,
  },
  {
    slug: "rezeptgenerator-erste-schritte",
    title: "Rezeptgenerator: Erste Schritte",
    summary:
      "Lege ein neues Rezept an, gehe die Schritte durch und speichere es in deinem Konto.",
    content: `Pfad: Werkstatt → Rezeptgenerator

1. Starte ein neues Rezept.
2. Folge den Schritten (Grunddaten, Zutaten, Technologie usw.).
3. Speichere zwischendurch — du findest deine Rezepte später wieder in der Werkstatt / Rezeptdatenbank (je nach Freigabe).

Hinweis: Manche Export- oder Premium-Funktionen können an die Mitgliedsstufe gebunden sein. Als Beta-Tester:in reicht oft schon das Anlegen und Speichern eines Testrezepts als Feedback.`,
    categorySlug: "rezeptgenerator",
    keywords: ["rezeptgenerator", "rezept", "anlegen", "speichern"],
    sortOrder: 70,
  },
  {
    slug: "akademie-kurse-finden-und-lernen",
    title: "Akademie: Kurse finden, kaufen und lernen",
    summary:
      "Im Kurskatalog findest du Minikurse und Zertifikatskurse. Nach dem Kauf lernst du im Mein-Bereich weiter.",
    content: `Kurse entdecken
- Akademie oder Akademie → Kurse öffnet den Katalog.
- Auf einer Kursseite siehst du Beschreibung, Aufbau und Preis.

Nach dem Kauf
- Der Kurs erscheint unter Mein Bereich → Meine Kurse.
- Dort öffnest du Module und Lektionen und siehst deinen Fortschritt.

Noch keine Kurse gebucht?
- Das ist normal am Anfang. Du kannst trotzdem Werkstatt und Community nutzen und den Katalog ansehen.`,
    categorySlug: "kurse",
    keywords: ["akademie", "kurs", "katalog", "lektion", "lernen"],
    sortOrder: 80,
  },
  {
    slug: "mitgliedschaft-was-bringt-sie",
    title: "Mitgliedschaft: Was bringen die Club-Stufen?",
    summary:
      "Basis ist kostenlos; Club-Stufen schalten zusätzliche Werkstatt- und Community-Vorteile frei.",
    content: `Auf Alles-Wurst gibt es eine kostenlose Basis nach Registrierung und optionale Club-Mitgliedschaften.

Typischerweise gilt:
- Basis: Mein-Bereich, ausgewählte Werkstatt-Tools, Kurse kaufen
- Club-Stufen: mehr Werkstatt-Tools, erweiterte Rezeptdatenbank-Inhalte, Community-Vorteile

Details und Preise findest du unter Mitgliedschaft. Deinen aktuellen Status siehst du im Mein-Bereich unter Mitgliedschaft.

Beta: Du brauchst für den Test oft keine bezahlte Stufe — teste zuerst die freigegebenen Bereiche und melde Lücken über Betatest oder Support.`,
    categorySlug: "mitgliedschaften",
    keywords: ["mitgliedschaft", "wurstclub", "meisterclub", "club", "stufe"],
    sortOrder: 90,
  },
  {
    slug: "bestellungen-und-rechnungen",
    title: "Wo finde ich Bestellungen und Rechnungen?",
    summary:
      "Alle Käufe und Belege liegen unter Mein Bereich → Bestellungen.",
    content: `Pfad: Mein Bereich → Bestellungen

Dort siehst du:
- getätigte Käufe (z. B. Kurse)
- Status und Details einer Bestellung
- zugehörige Belege, sofern vorhanden

Fehlt eine Bestellung nach dem Bezahlen? Warte kurz und lade die Seite neu. Bleibt sie weg, öffne ein Support-Ticket und nenne Datum, Betrag und ggf. die Bestätigungsmail.`,
    categorySlug: "zahlungen",
    keywords: ["bestellung", "rechnung", "beleg", "zahlung", "kauf"],
    sortOrder: 100,
  },
  {
    slug: "zertifikate-nach-kursabschluss",
    title: "Zertifikate und Teilnahmeurkunden",
    summary:
      "Nach erfolgreichem Kursabschluss erscheinen Nachweise unter Mein Bereich → Zertifikate.",
    content: `Wenn ein Kurs einen Abschlussnachweis vorsieht (Teilnahmeurkunde oder Zertifikat), wird dieser nach Erfüllung der Kursbedingungen bereitgestellt.

Pfad: Mein Bereich → Zertifikate

Dort kannst du den Status sehen und — sofern freigeschaltet — das PDF herunterladen.

Erscheint kein Zertifikat, obwohl du den Kurs abgeschlossen hast: prüfe im Kurs, ob alle Pflichtlektionen erledigt sind, oder melde dich über den Support.`,
    categorySlug: "zertifikate",
    keywords: ["zertifikat", "urkunde", "abschluss", "pdf"],
    sortOrder: 110,
  },
  {
    slug: "support-ticket-erstellen",
    title: "Wie erreiche ich den Support?",
    summary:
      "Im Mein-Bereich unter Support erstellst du Tickets und liest Antworten nach.",
    content: `Pfad: Mein Bereich → Support

1. Neues Ticket erstellen und dein Anliegen möglichst konkret beschreiben (Seite, Fehlermeldung, Screenshot-Hinweis).
2. Auf Antworten im selben Ticket achten — ungelesene Antworten siehst du auch in der Übersicht.
3. Vor dem Ticket gerne die Wissensdatenbank durchsuchen — oft ist die Antwort schon da.

Beta-Tester:innen: Für produktbezogene Testaufgaben zuerst den Bereich Betatest prüfen; technische Störungen oder Blocker bitte als Support-Ticket melden.`,
    categorySlug: "technische-probleme",
    keywords: ["support", "ticket", "hilfe", "kontakt"],
    sortOrder: 120,
  },
  {
    slug: "wartung-und-beta-zugang",
    title: "Wartungsmodus: Warum sehe ich die Seite / warum nicht?",
    summary:
      "Während der Beta ist die Seite oft im Wartungsmodus. Mit gültiger Einladung erhältst du einen Bypass.",
    content: `In der Beta-Phase kann die öffentliche Seite im Wartungsmodus sein.

Mit Beta-Zugang
- Nach Annahme der Einladung erhältst du einen Wartungs-Bypass und kannst die Plattform normal nutzen.

Ohne Einladung
- Du landest ggf. auf der Wartungsseite und kannst dich noch nicht frei bewegen.

Probleme nach der Einladung?
- Einmal abmelden und neu anmelden
- Einladungslink erneut öffnen (falls noch gültig)
- Sonst Support-Ticket mit deiner E-Mail-Adresse`,
    categorySlug: "technische-probleme",
    keywords: ["wartung", "wartungsmodus", "bypass", "beta", "einladung"],
    sortOrder: 130,
  },
  {
    slug: "passwort-zuruecksetzen",
    title: "Passwort vergessen — wie setze ich es zurück?",
    summary:
      "Über „Passwort vergessen“ auf der Anmeldeseite erhältst du einen Reset-Link per E-Mail.",
    content: `1. Öffne Anmelden und wähle „Passwort vergessen“.
2. Gib deine E-Mail-Adresse ein.
3. Öffne den Link in der E-Mail und vergib ein neues Passwort.
4. Melde dich danach normal an.

Keine Mail erhalten? Spam prüfen und den Vorgang nach einigen Minuten erneut versuchen. Bleibt es aus, nutze den Support.`,
    categorySlug: "konto-registrierung",
    keywords: ["passwort", "vergessen", "reset", "zurücksetzen"],
    sortOrder: 140,
  },
];

async function main() {
  await ensureDefaultKnowledgeBaseCategories();

  const categories = await prisma.knowledgeBaseCategory.findMany({
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const faq of STARTER_FAQS) {
    const categoryId = categoryBySlug.get(faq.categorySlug);

    if (!categoryId) {
      console.warn(`Kategorie fehlt, überspringe: ${faq.categorySlug} (${faq.slug})`);
      skipped += 1;
      continue;
    }

    const existing = await prisma.knowledgeBaseArticle.findUnique({
      where: { slug: faq.slug },
      select: { id: true, status: true },
    });

    if (existing && existing.status !== "draft") {
      console.log(`Übersprungen (bereits ${existing.status}): ${faq.slug}`);
      skipped += 1;
      continue;
    }

    if (existing) {
      await prisma.knowledgeBaseArticle.update({
        where: { id: existing.id },
        data: {
          title: faq.title,
          summary: faq.summary,
          content: faq.content,
          categoryId,
          keywords: faq.keywords.map((k) => k.toLowerCase()),
          status: "draft",
          visibility: "public",
          sortOrder: faq.sortOrder,
          publishedAt: null,
        },
      });
      updated += 1;
      console.log(`Aktualisiert (draft): ${faq.slug}`);
    } else {
      await prisma.knowledgeBaseArticle.create({
        data: {
          slug: faq.slug,
          title: faq.title,
          summary: faq.summary,
          content: faq.content,
          categoryId,
          keywords: faq.keywords.map((k) => k.toLowerCase()),
          status: "draft",
          visibility: "public",
          sortOrder: faq.sortOrder,
          publishedAt: null,
        },
      });
      created += 1;
      console.log(`Angelegt (draft): ${faq.slug}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        created,
        updated,
        skipped,
        totalDefined: STARTER_FAQS.length,
        note: "Alle neuen/aktualisierten Einträge sind draft — Freigabe im Admin unter /admin/support/wissensdatenbank",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
