/**
 * @file social-media-env-check.ts
 * @purpose Serverseitige Prüfung von Umgebungsvariablen (ohne Werte preiszugeben).
 */

export type EnvVarStatus = "set" | "missing" | "invalid" | "weak";

export type EnvVarCheckResult = {
  name: string;
  label: string;
  status: EnvVarStatus;
  message: string;
  recommended?: string;
};

const WEAK_SECRETS = new Set([
  "123456",
  "secret",
  "changeme",
  "test",
  "cronsecret",
  "password",
  "admin",
  "social_media_cron_secret",
]);

function checkSecretVar(
  name: string,
  label: string,
  minLength = 32,
): EnvVarCheckResult {
  const value = process.env[name]?.trim();

  if (!value) {
    return {
      name,
      label,
      status: "missing",
      message: `${label} ist nicht gesetzt.`,
      recommended: `Setze ${name} in der Server-Umgebung (mindestens ${minLength} Zeichen).`,
    };
  }

  if (value.length < minLength) {
    return {
      name,
      label,
      status: "invalid",
      message: `${label} ist zu kurz (mindestens ${minLength} Zeichen empfohlen).`,
    };
  }

  if (WEAK_SECRETS.has(value.toLowerCase())) {
    return {
      name,
      label,
      status: "weak",
      message: `${label} verwendet einen unsicheren Standardwert.`,
    };
  }

  return {
    name,
    label,
    status: "set",
    message: `${label} ist gesetzt.`,
  };
}

export function checkSocialMediaEnvironment(): EnvVarCheckResult[] {
  const results: EnvVarCheckResult[] = [
    checkSecretVar(
      "SOCIAL_MEDIA_CRON_SECRET",
      "Cron-Secret (SOCIAL_MEDIA_CRON_SECRET)",
    ),
  ];

  const encryptionSecret =
    process.env.SOCIAL_MEDIA_ENCRYPTION_SECRET?.trim() ??
    process.env.STRIPE_KEY_ENCRYPTION_SECRET?.trim() ??
    process.env.AUTH_SESSION_SECRET?.trim();

  if (!encryptionSecret) {
    results.push({
      name: "SOCIAL_MEDIA_ENCRYPTION_SECRET",
      label: "Verschlüsselungsgeheimnis",
      status: "missing",
      message:
        "Kein Verschlüsselungsgeheimnis gefunden (SOCIAL_MEDIA_ENCRYPTION_SECRET, STRIPE_KEY_ENCRYPTION_SECRET oder AUTH_SESSION_SECRET).",
    });
  } else if (encryptionSecret.length < 32) {
    results.push({
      name: "SOCIAL_MEDIA_ENCRYPTION_SECRET",
      label: "Verschlüsselungsgeheimnis",
      status: "invalid",
      message: "Verschlüsselungsgeheimnis ist zu kurz.",
    });
  } else {
    results.push({
      name: "SOCIAL_MEDIA_ENCRYPTION_SECRET",
      label: "Verschlüsselungsgeheimnis",
      status: "set",
      message: "Verschlüsselungsgeheimnis ist verfügbar.",
    });
  }

  const youtubeEnv = process.env.YOUTUBE_API_KEY?.trim();

  results.push({
    name: "YOUTUBE_API_KEY",
    label: "YouTube API-Key (optional, global)",
    status: youtubeEnv ? "set" : "missing",
    message: youtubeEnv
      ? "Globaler YouTube API-Key ist in der Umgebung gesetzt (optional, Kanal-Credentials haben Vorrang)."
      : "Kein globaler YouTube API-Key in der Umgebung — kann pro Kanal in der Datenbank hinterlegt werden.",
  });

  return results;
}

export function isCronSecretConfigured(): boolean {
  const check = checkSecretVar(
    "SOCIAL_MEDIA_CRON_SECRET",
    "Cron-Secret",
  );

  return check.status === "set";
}

export function isNonProductionEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}
