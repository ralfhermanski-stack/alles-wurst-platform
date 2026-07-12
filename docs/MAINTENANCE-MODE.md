# Wartungsmodus

Plattformweiter Wartungsmodus mit Admin-Steuerung.

## Admin

- Navigation: **System → Wartungsmodus** (`/admin/wartungsmodus`)
- Aktivieren / Deaktivieren per Klick
- Inhalte, Logo/Hintergrund per Upload, Live-Vorschau, Countdown, HTTP-Status (503/200), Newsletter-Feld bearbeiten
- Rotes Banner im Admin-Dashboard bei aktivem Modus

## Bypass

Folgende Nutzer sehen die normale Website:

- `systemRole = ADMIN`
- `maintenanceBypass = true` (pro Nutzer unter Admin → Benutzer per API/PATCH)

## Ausnahmen (immer erreichbar)

- `/admin/*`
- `/anmelden`, `/login` → `/anmelden`
- `/dashboard` → `/admin`
- `/api/*`
- `/wartung` (Wartungsseite)

## Technik

| Bereich | Pfad |
|---------|------|
| Middleware | `middleware.ts` (Status-Probe über `http://127.0.0.1:PORT`, optional `MAINTENANCE_PROBE_URL`) |
| Service | `lib/maintenance/` |
| Wartungsseite | `app/wartung/` |
| Migration | `20260709150000_maintenance_mode`, `20260709160000_maintenance_image_upload` |
| Bild-Upload | `POST/DELETE /api/admin/maintenance/images/{logo|background}` |
| Bild-Auslieferung | `GET /api/maintenance/images/{logo|background}` |

## Tests

```bash
node scripts/test-maintenance-mode.cjs
```
