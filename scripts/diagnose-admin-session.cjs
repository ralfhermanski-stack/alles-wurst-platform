/**
 * Vollständiger Admin-Auth-Diagnose-Test (lokal).
 * Simuliert Session-Token und prüft Admin-API für jeden Nutzer.
 */

const { PrismaClient } = require("@prisma/client");
const { webcrypto } = require("node:crypto");

const prisma = new PrismaClient();

const SESSION_COOKIE_NAME = "aw_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if ((!secret || secret.length < 32) && process.env.NODE_ENV !== "production") {
    return "dev-auth-session-secret-fallback-change-me-please-32plus";
  }

  return secret;
}

function toBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signData(data, secret) {
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await webcrypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );

  return toBase64Url(new Uint8Array(signature));
}

async function createSessionToken(userId, systemRole = "USER") {
  const payload = {
    userId,
    systemRole,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const data = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signData(data, getSessionSecret());

  return `${data}.${signature}`;
}

async function testAdminSession(email, systemRoleFromToken) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (!user) {
    console.log(`  User nicht gefunden: ${email}`);
    return;
  }

  const token = await createSessionToken(user.id, systemRoleFromToken);
  const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

  const sessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    },
  });

  const sessionJson = await sessionResponse.json();

  const authSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    },
  });

  const authSessionJson = await authSessionResponse.json();

  console.log(`\n--- ${email} ---`);
  console.log("  DB systemRole:", user.systemRole);
  console.log("  Token systemRole:", systemRoleFromToken);
  console.log(
    "  /api/auth/session systemRole:",
    authSessionJson.data?.systemRole ?? authSessionJson.data,
  );
  console.log(
    "  /api/admin/session:",
    sessionJson.success ? "OK" : sessionJson.error?.message,
  );
}

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { email: true, systemRole: true },
  });

  console.log("Nutzer:");
  for (const user of users) {
    console.log(`  ${user.email} → ${user.systemRole}`);
  }

  for (const user of users) {
    await testAdminSession(user.email, user.systemRole);
  }

  // Altes Token ohne systemRole (Legacy)
  const admin = users.find((u) => u.systemRole === "ADMIN");

  if (admin) {
    const legacyPayload = {
      userId: (
        await prisma.user.findFirst({ where: { email: admin.email } })
      ).id,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    };

    const data = toBase64Url(
      new TextEncoder().encode(JSON.stringify(legacyPayload)),
    );
    const signature = await signData(data, getSessionSecret());
    const legacyToken = `${data}.${signature}`;
    const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/admin/session`, {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(legacyToken)}`,
      },
    });

    const json = await response.json();

    console.log(`\n--- Legacy-Token (ohne systemRole) für Admin ---`);
    console.log(
      "  /api/admin/session:",
      json.success ? "OK" : json.error?.message,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
