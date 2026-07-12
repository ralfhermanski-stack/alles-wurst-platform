#!/usr/bin/env bash
# Mitgliedschafts-Cron auf Linux (Strato/Ubuntu): täglich Verlängerungshinweise + Ablauf + geplante Löschungen
#
# Voraussetzung: MEMBERSHIP_CRON_SECRET oder LEGAL_CRON_SECRET in /var/www/alles-wurst-platform/.env
#
# Installation (als root auf dem Server):
#   chmod +x scripts/install-membership-cron.sh
#   ./scripts/install-membership-cron.sh
#
# Manueller Test:
#   ./scripts/install-membership-cron.sh --test

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/alles-wurst-platform}"
DOMAIN="${DOMAIN:-https://alles-wurst.de}"
CRON_TIME="${CRON_TIME:-0 8 * * *}"
LOG_FILE="${LOG_FILE:-/var/log/alles-wurst-membership-cron.log}"
CRON_TAG="alles-wurst-membership-renewals"

load_secret() {
  local env_file="$APP_DIR/.env"
  if [[ ! -f "$env_file" ]]; then
    echo "FEHLER: .env nicht gefunden: $env_file" >&2
    exit 1
  fi

  local secret
  secret="$(grep -E '^MEMBERSHIP_CRON_SECRET=' "$env_file" | head -1 | cut -d= -f2- | tr -d '"'"'" || true)"
  if [[ -z "$secret" ]]; then
    secret="$(grep -E '^LEGAL_CRON_SECRET=' "$env_file" | head -1 | cut -d= -f2- | tr -d '"'"'" || true)"
  fi

  if [[ -z "$secret" || ${#secret} -lt 32 ]]; then
    echo "FEHLER: MEMBERSHIP_CRON_SECRET oder LEGAL_CRON_SECRET (min. 32 Zeichen) in .env setzen." >&2
    exit 1
  fi

  printf '%s' "$secret"
}

run_once() {
  local secret
  secret="$(load_secret)"
  curl -fsS -X POST "${DOMAIN}/api/cron/membership-renewals" \
    -H "Authorization: Bearer ${secret}" \
    -H "Content-Type: application/json"
  echo
}

if [[ "${1:-}" == "--test" ]]; then
  echo "Test-Aufruf: ${DOMAIN}/api/cron/membership-renewals"
  run_once
  exit 0
fi

SECRET_PLACEHOLDER='__AW_MEMBERSHIP_CRON_SECRET__'
CRON_CMD="${CRON_TIME} curl -fsS -X POST ${DOMAIN}/api/cron/membership-renewals -H \"Authorization: Bearer ${SECRET_PLACEHOLDER}\" >> ${LOG_FILE} 2>&1 # ${CRON_TAG}"

# Secret zur Laufzeit aus .env lesen (Cron-Job als Shell-One-Liner)
CRON_LINE="${CRON_TIME} bash -c 'SECRET=\$(grep -E \"^MEMBERSHIP_CRON_SECRET=\" ${APP_DIR}/.env | head -1 | cut -d= -f2- | tr -d \"\\\"\\\"\"); if [ -z \"\$SECRET\" ]; then SECRET=\$(grep -E \"^LEGAL_CRON_SECRET=\" ${APP_DIR}/.env | head -1 | cut -d= -f2- | tr -d \"\\\"\\\"\"); fi; curl -fsS -X POST ${DOMAIN}/api/cron/membership-renewals -H \"Authorization: Bearer \$SECRET\" >> ${LOG_FILE} 2>&1' # ${CRON_TAG}"

# Alte Einträge entfernen, neuen setzen
( crontab -l 2>/dev/null | grep -v "${CRON_TAG}" || true; echo "${CRON_LINE}" ) | crontab -

touch "$LOG_FILE"
chmod 640 "$LOG_FILE" 2>/dev/null || true

echo "Cron installiert: täglich 08:00 (${CRON_TIME})"
echo "Log: ${LOG_FILE}"
echo "Test jetzt ausführen: $0 --test"
