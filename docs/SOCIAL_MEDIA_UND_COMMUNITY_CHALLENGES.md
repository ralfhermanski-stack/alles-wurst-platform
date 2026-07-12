# Social Media & Community Challenges

## Architektur

Drei verbundene Systeme:

1. **Social-Media-Verwaltung** (`lib/social-media/`) — Kanäle, Beiträge, Sync, Credentials
2. **Startseiten-Darstellung** (`components/marketing/HomepageCommunitySocialSection.tsx`) — liest nur lokale DB-Daten
3. **Community-Challenges** (`lib/challenges/`) — monatliche Wettbewerbe mit Moderation

Externe APIs werden **ausschließlich serverseitig** im Sync-Service aufgerufen, nie beim Seitenaufruf.

## Datenmodelle

- `SocialMediaChannel`, `SocialMediaCredential`, `SocialMediaPost`, `SocialMediaSyncLog`
- `CommunityChallenge`, `ChallengeSubmission`, `ChallengeSubmissionMedia`, `ChallengeVote`, `ChallengeUserState`, `ChallengeNotificationLog`

## Admin

- **Marketing → Social Media**: `/admin/marketing/social-media`
- **Community → Challenges**: `/admin/community/challenges`

## Plattformen

| Plattform | API-Modus | Fallback |
|-----------|-----------|----------|
| YouTube | Data API v3 (Kanal + Upload-Playlist) | Manuell |
| TikTok | Display API (nach App-Freigabe) | Manuell / Embed |
| Instagram | Meta Graph API | Manuell / Embed |
| Facebook | Pages API | Manuell |

## Synchronisierung

- Cron: `POST /api/cron/social-media` mit `Bearer SOCIAL_MEDIA_CRON_SECRET`
- Manuell: Admin → Kanal → „Jetzt synchronisieren“
- Intervalle pro Kanal konfigurierbar (`syncIntervalMinutes`)

## Sicherheit

- Credentials: AES-256-GCM (`lib/social-media/social-credential-crypto.ts`)
- Secrets nie im Client, maskiert in der Admin-UI
- Challenge-Medien: `storage/challenge-submissions/`, nur freigegebene öffentlich

## Challenges

- Teilnahmeberechtigung serverseitig (`challenge-eligibility.ts`)
- Einreichungen: Entwurf → Einreichen → Moderation → Freigabe
- Popup-Logik: `challenge-popup-service.ts` (serverseitiger Status)

## Tests

```bash
node scripts/test-social-challenges.cjs
```

## Lokale Entwicklung

```env
SOCIAL_MEDIA_CRON_SECRET=...
YOUTUBE_API_KEY=...          # optional für YouTube-Sync
SOCIAL_MEDIA_ENCRYPTION_SECRET=...  # optional, Fallback auf AUTH_SESSION_SECRET
```

Siehe auch: [SOCIAL_MEDIA_API_EINRICHTUNG.md](./SOCIAL_MEDIA_API_EINRICHTUNG.md)
