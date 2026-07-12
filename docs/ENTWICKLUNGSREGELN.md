# Entwicklungsregeln – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Status:** Verbindlich ab Frontend-Implementierungsphase  

---

## 1. Zweck

Dieses Dokument legt die verbindlichen Arbeits- und Code-Regeln für die schrittweise Umsetzung von Alles-Wurst 2.0 fest.  
Ab jetzt werden echte Funktionen dosiert und nachvollziehbar eingeführt – nicht alles auf einmal.

---

## 2. Arbeitsregeln

### 2.1 Schrittweise Umsetzung

1. **Immer nur eine Funktion pro Schritt umsetzen.**  
   Kein Parallelbau mehrerer Features in einem Commit oder einer Aufgabe.

2. **Vor jeder Umsetzung kurz erklären:**
   - Was wird gebaut?
   - Welche Dateien werden geändert?
   - Warum wird es so gelöst?

3. **Keine großen Umbauten ohne Rückfrage.**  
   Architekturänderungen, Refactorings über mehrere Bereiche oder Strukturbrüche immer vorher abstimmen.

4. **Keine Datenbank, Authentifizierung oder API einbauen, ohne vorherige Freigabe.**  
   Backend-Anbindungen sind bewusst gesperrt, bis sie explizit freigegeben werden.

5. **Keine neuen Pakete installieren, ohne vorher zu erklären, warum sie nötig sind.**  
   Jede neue Abhängigkeit muss begründet und genehmigt werden.

### 2.2 Qualitätssicherung nach jedem Schritt

Nach **jedem** abgeschlossenen Entwicklungsschritt sind folgende Befehle auszuführen:

```bash
npm run lint
npm run build
```

Das Ergebnis (Erfolg oder Fehler) wird gemeldet.

---

## 3. Code-Regeln

### 3.1 Lesbarkeit und Kommentare

1. **Quelltext ausführlich kommentieren.**  
   Besonders bei fachlicher Logik (z. B. Rechner, Berechnungen, Zugangsregeln).

2. **Jede Komponente erhält einen Kommentarblock mit:**
   - Zweck der Komponente
   - verwendeten Props
   - Einsatzort (wo die Komponente verwendet wird)

3. **Komplexe Logik immer direkt im Code erklären.**  
   Keine „magischen" Einzeiler ohne Kontext.

4. **Keine unverständlichen Kurzlösungen.**  
   Lesbarkeit geht vor cleveren Tricks.

### 3.2 Struktur und Wiederverwendung

5. **Klare Dateinamen.**  
   Dateiname = Inhalt erkennbar (z. B. `SaltCalculator.tsx`, `salt-calculator.ts`).

6. **Klare Ordnerstruktur.**  
   Marketing, Member, Admin, Cards, Tools, Lib strikt trennen.

7. **Keine toten Dateien.**  
   Ungenutzte Dateien entfernen, nicht liegen lassen.

8. **Keine ungenutzten Imports.**  
   Nach jeder Änderung bereinigen.

9. **Wiederverwendbare Komponenten statt Copy-Paste.**  
   Gemeinsame UI-Elemente zentral halten.

### 3.3 TypeScript

10. **TypeScript sauber nutzen.**  
    Keine `any`-Typen ohne schriftliche Begründung im Code oder in der Schritt-Erklärung.

---

## 4. Dokumentationsbezug

Diese Regeln ergänzen die Fachdokumentation in `/docs`:

| Dokument | Inhalt |
|----------|--------|
| `LASTENHEFT.md` | Anforderungen |
| `PFLICHTENHEFT.md` | Lösungskonzept |
| `SEITENSTRUKTUR.md` | Seiten und Bereiche |
| `ROADMAP.md` | Phasenplan |
| `DATENMODELL.md` | Datenstrukturen (für spätere Backend-Phase) |

Bei Widersprüchen gilt: **Dieses Dokument für den Entwicklungsprozess**, Fachdokumente für fachliche Inhalte.

---

## 5. Freigabe-Grenzen (Kurzreferenz)

| Bereich | Ohne Freigabe erlaubt | Nur mit Freigabe |
|---------|----------------------|------------------|
| UI / Layout | ✓ | |
| Client-seitige Logik (Rechner, Filter) | ✓ | |
| Platzhalterdaten in `lib/` | ✓ | |
| Datenbank / ORM | | ✓ |
| Authentifizierung | | ✓ |
| API-Routen / Server-Actions mit Persistenz | | ✓ |
| E-Mail-Versand | | ✓ |
| Zahlungsanbindung | | ✓ |
| Neue npm-Pakete | | ✓ (mit Begründung) |

---

## 6. Ablauf pro Entwicklungsschritt

```
1. Vorschlag machen (was / welche Dateien / warum)
2. Freigabe abwarten (bei Bedarf)
3. Eine Funktion implementieren
4. Kommentare und Typen prüfen
5. npm run lint
6. npm run build
7. Ergebnis melden
```

---

*Alles-Wurst 2.0 – The Crest of Craftsmanship*
