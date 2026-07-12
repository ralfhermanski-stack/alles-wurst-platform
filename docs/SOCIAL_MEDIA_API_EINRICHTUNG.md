# Social-Media-API Einrichtung

Keine geheimen Werte in dieses Dokument eintragen.

## YouTube

| Schritt | Aktion |
|---------|--------|
| Entwicklerkonto | [Google Cloud Console](https://console.cloud.google.com/) |
| API aktivieren | YouTube Data API v3 |
| Credentials | API-Key erstellen |
| In Alles Wurst | Admin → Marketing → Social Media → Schnittstellen → API-Key |
| Kanal-ID | YouTube-Kanal → Erweiterte Einstellungen → Kanal-ID |
| Test | Admin → Kanal → „Verbindung testen“ / „Jetzt synchronisieren“ |

**Ohne API-Key:** Kanal im Modus „Manuell“ anlegen, Beiträge und Profil-URL manuell pflegen.

## TikTok

| Schritt | Aktion |
|---------|--------|
| Entwicklerkonto | [TikTok for Developers](https://developers.tiktok.com/) |
| App | Display API App erstellen |
| Redirect-URL | `https://ihre-domain.de/api/social-media/oauth/tiktok/callback` |
| Scopes | `user.info.basic`, `video.list` (je nach Freigabe) |
| Freigabe | App-Review erforderlich für Produktivbetrieb |

**Ohne Freigabe:** Modus „Manuell“ — Links und Vorschaubilder manuell hinterlegen.

## Instagram

| Schritt | Aktion |
|---------|--------|
| Voraussetzung | Professionelles Instagram-Konto |
| Meta-App | [Meta for Developers](https://developers.facebook.com/) |
| Produkt | Instagram Graph API |
| Verknüpfung | Facebook-Seite mit Instagram verbinden |
| Token | Page/User Access Token mit `instagram_basic`, `instagram_content_publish` |

**Fallback:** Manuell oder Embed.

## Facebook

| Schritt | Aktion |
|---------|--------|
| Meta-App | Facebook Login + Pages API |
| Seite | Alles-Wurst-Facebook-Seite |
| Token | Page Access Token |
| Berechtigungen | `pages_read_engagement`, `pages_show_list` |

**Fallback:** Manuell.

## Cronjob (Produktion)

```http
POST /api/cron/social-media
Authorization: Bearer <SOCIAL_MEDIA_CRON_SECRET>
```

| Eigenschaft | Wert |
|-------------|------|
| Methode | `POST` |
| Pfad | `/api/cron/social-media` |
| Auth | Header `Authorization: Bearer <SOCIAL_MEDIA_CRON_SECRET>` (kein Query-Parameter) |
| Secret-Länge | Mindestens 32 Zeichen empfohlen |
| Rate-Limit | 10 Anfragen/Minute pro IP |
| Erfolg | `200` — `{ "success": true, "synced": <number> }` |
| Fehler | `401` Unauthorized, `429` Too Many Requests, `500` Serverfehler |

**Admin-Diagnose:** Marketing → Social Media → Cronjob oder Einrichtung  
**Manuelle Simulation:** Button „Cronjob lokal simulieren“ (nutzt denselben Service wie der echte Cron)

Empfohlen: alle 1–2 Stunden via Scheduler (z. B. Vercel Cron, Linux-Cron, cron-job.org).

Siehe auch: [SOCIAL_MEDIA_CHALLENGE_PRAXISTEST.md](./SOCIAL_MEDIA_CHALLENGE_PRAXISTEST.md)
