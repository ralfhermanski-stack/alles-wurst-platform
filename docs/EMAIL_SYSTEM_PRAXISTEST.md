# E-Mail-System — Praxistest

| Bereich | Schritt | Erwartet | Tatsächlich | Bestanden | Bemerkung |
|---------|---------|----------|-------------|-----------|-----------|
| Konfiguration | Provider einrichten | Aktiv in Admin | | | |
| Konfiguration | Absender verifizieren | verified=true | | | |
| Konfiguration | Testmail | Status SENT/Queue | | | |
| System | Registrierung/Verify | E-Mail in Queue | | | |
| System | Passwort-Reset | E-Mail in Queue | | | |
| System | Kaufbestätigung | ORDER-Kategorie | | | |
| System | Ticketantwort | TICKET + Link | | | |
| System | Datenschutz Export | PRIVACY-Vorlage | | | |
| System | Widerruf | WITHDRAWAL | | | |
| Berechtigung | Normaler User POST /api/admin/email/send | 403 | | | |
| Berechtigung | Support Massenmail | 403 | | | |
| Queue | Cron ohne Secret | 401 | | | |
| Queue | Cron mit Secret | processed > 0 | | | |
| Queue | Retry nach Fehler | RETRYING → SENT | | | |
| Anhänge | PDF erlaubt | Versand OK | | | |
| Anhänge | EXE blockiert | 400 | | | |
