# Social Media & Challenges — Praxistest

Schritt-für-Schritt-Checkliste für Administratoren. Jeder Punkt mit erwartetem Ergebnis, tatsächlichem Ergebnis, Bestanden (ja/nein) und Bemerkung.

**Umgebung:** Entwicklung / Staging  
**Datum:** __________  
**Tester:** __________

---

## Social Media

| # | Schritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Bestanden | Bemerkung |
|---|---------|---------------------|------------------------|-----------|-----------|
| 1 | TikTok-Kanal anlegen (`/admin/marketing/social-media/kanaele`) | Kanal gespeichert, in Liste sichtbar | | ja/nein | |
| 2 | Instagram-Kanal anlegen | Kanal gespeichert, Profil-URL validiert | | ja/nein | |
| 3 | Facebook-Kanal anlegen | Kanal gespeichert | | ja/nein | |
| 4 | YouTube-Kanal anlegen (API-Modus) | Kanal mit Kanal-ID gespeichert | | ja/nein | |
| 5 | Manuellen Beitrag anlegen | Beitrag in Adminliste, auf Startseite wenn aktiv | | ja/nein | |
| 6 | YouTube-Verbindung testen (`Schnittstellen`) | Erfolgsmeldung, Kanalname sichtbar, kein API-Key im Klartext | | ja/nein | |
| 7 | YouTube synchronisieren | Videos importiert, Sync-Protokoll-Eintrag | | ja/nein | |
| 8 | Startseite prüfen (`/`) | Aktive Kanäle in Reihenfolge, keine Platzhalter | | ja/nein | |
| 9 | Mobilansicht prüfen | Karten responsiv, Links funktionieren | | ja/nein | |
| 10 | Deaktivierten Kanal prüfen | Kanal nicht auf Startseite sichtbar | | ja/nein | |
| 11 | Fehlerfall prüfen (ungültige URL) | Verständliche deutsche Fehlermeldung | | ja/nein | |
| 12 | Einrichtungsassistent (`/admin/marketing/social-media/einrichtung`) | Status pro Bereich, „Jetzt prüfen“ funktioniert | | ja/nein | |
| 13 | Cronjob-Diagnose (`/admin/marketing/social-media/cronjob`) | Endpunkt, Secret-Status, Simulation | | ja/nein | |

---

## Challenges

| # | Schritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Bestanden | Bemerkung |
|---|---------|---------------------|------------------------|-----------|-----------|
| 14 | Test-Challenge anlegen (`/admin/system/testdaten`) | Challenge aktiv, als Test markiert | | ja/nein | |
| 15 | Challenge manuell erstellen & veröffentlichen | Slug eindeutig, Status ACTIVE | | ja/nein | |
| 16 | Startseite prüfen | Challenge-Karte für berechtigte Nutzer | | ja/nein | |
| 17 | Mein Bereich prüfen | Challenge mit CTA sichtbar | | ja/nein | |
| 18 | Popup prüfen | Erscheint einmalig, Aktionen speichern Status | | ja/nein | |
| 19 | Teilnahme beginnen | Entwurf startet | | ja/nein | |
| 20 | Entwurf speichern | Status DRAFT in DB | | ja/nein | |
| 21 | Beitrag einreichen | Status SUBMITTED, Frist beachtet | | ja/nein | |
| 22 | Adminmoderation | Freigabe/Ablehnung, Audit-Log | | ja/nein | |
| 23 | Öffentliche Anzeige | Nur freigegebene Beiträge sichtbar | | ja/nein | |
| 24 | Challenge beenden & archivieren | Nicht mehr auf Startseite | | ja/nein | |
| 25 | Testdaten löschen | Alle `isTestData`-Einträge entfernt | | ja/nein | |

---

## Produktions-Checkliste (vor Serverstart)

- [ ] `SOCIAL_MEDIA_CRON_SECRET` gesetzt (min. 32 Zeichen, kein Standardwert)
- [ ] YouTube API-Key eingerichtet (DB oder `YOUTUBE_API_KEY`)
- [ ] YouTube Kanal-ID hinterlegt
- [ ] Cronjob beim Hosting eingerichtet (siehe unten)
- [ ] Cronroute mit korrektem Secret getestet
- [ ] HTTPS aktiv
- [ ] Produktionsdomain und Redirect-URLs geprüft
- [ ] Dateispeicher (`storage/`) beschreibbar
- [ ] Backup-Strategie geprüft
- [ ] Fehlerprotokollierung aktiv
- [ ] Alle Testdaten entfernt
- [ ] Kanäle aktiviert und Startseiten-Anzeige geprüft
- [ ] Erste echte Challenge veröffentlicht

### Cron-Endpunkt (tatsächlich implementiert)

```
POST /api/cron/social-media
Header: Authorization: Bearer <SOCIAL_MEDIA_CRON_SECRET>
```

**Antworten:** `200` Erfolg, `401` nicht autorisiert, `429` Rate-Limit, `500` Fehler  
**Rückgabe:** `{ "success": true, "synced": <number> }`

### Cron-Beispiele

**Linux-Cron (alle 2 Stunden):**
```bash
0 */2 * * * curl -sS -X POST https://ihre-domain.de/api/cron/social-media -H "Authorization: Bearer IHR_SECRET"
```

**Vercel Cron (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/cron/social-media",
    "schedule": "0 */2 * * *"
  }]
}
```
*(Secret als Umgebungsvariable; Vercel sendet `Authorization: Bearer` wenn konfiguriert.)*

**Externer Dienst (z. B. cron-job.org):**
- URL: `https://ihre-domain.de/api/cron/social-media`
- Methode: POST
- Header: `Authorization: Bearer <SOCIAL_MEDIA_CRON_SECRET>`

### Umgebungsvariablen

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `SOCIAL_MEDIA_CRON_SECRET` | Ja (Produktion) | Cron-Authentifizierung |
| `SOCIAL_MEDIA_ENCRYPTION_SECRET` | Empfohlen | Verschlüsselung API-Keys in DB |
| `YOUTUBE_API_KEY` | Optional | Globaler Fallback; Kanal-Key in DB hat Vorrang |
| `AUTH_SESSION_SECRET` | Fallback | Wird für Verschlüsselung genutzt wenn kein dediziertes Secret |

### Lokal vs. Server

| Funktion | Lokal testbar | Nur auf Server |
|----------|---------------|----------------|
| Kanäle & manuelle Beiträge | ✓ | |
| YouTube-Verbindungstest | ✓ (mit API-Key) | |
| Startseiten-Vorschau | ✓ | |
| Test-Challenge | ✓ (Dev/Staging) | |
| Echter Cron vom Hoster | | ✓ |
| HTTPS-Produktionsdomain | | ✓ |
| E-Mail-Benachrichtigungen Challenges | Teilweise | ✓ |
