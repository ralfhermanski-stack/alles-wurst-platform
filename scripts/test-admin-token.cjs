const { webcrypto } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const secret = "dev-auth-session-secret-fallback-change-me-please-32plus";

function toBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signData(data) {
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

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "ralf.hermanski@alles-wurst.de" },
  });

  const payload = {
    userId: user.id,
    systemRole: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const data = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const token = `${data}.${await signData(data)}`;

  const response = await fetch("http://localhost:3000/api/auth/session", {
    headers: {
      cookie: `aw_session=${encodeURIComponent(token)}`,
    },
  });

  console.log(response.status, await response.text());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
