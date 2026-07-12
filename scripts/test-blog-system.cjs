#!/usr/bin/env node
/**
 * Testskript für das Blog-/Magazin-System.
 *
 * Ausführung: node scripts/test-blog-system.cjs
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "ralf.hermanski@alles-wurst.de";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Admin123!";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

async function login() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const setCookie = response.headers.get("set-cookie");

  if (!response.ok || !setCookie) {
    throw new Error("Login fehlgeschlagen");
  }

  const sessionMatch = setCookie.match(/aw_session=[^;]+/);

  if (!sessionMatch) {
    throw new Error("Session-Cookie fehlgeschlagen");
  }

  return sessionMatch[0];
}

async function adminFetch(path, cookie, options = {}) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Cookie: cookie,
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });
}

async function run() {
  console.log("Blog-System Tests\n");

  let cookie;

  try {
    cookie = await login();
    ok("Admin-Login");
  } catch (error) {
    fail("Admin-Login", error.message);
    process.exit(1);
  }

  const sessionRes = await adminFetch("/api/admin/blog/session", cookie);
  const sessionJson = await sessionRes.json();

  if (sessionRes.ok && sessionJson.success) {
    ok("Blog-Session API");
  } else {
    fail("Blog-Session API", sessionJson.error?.message);
  }

  const topicsRes = await adminFetch("/api/admin/blog/topics", cookie);
  const topicsJson = await topicsRes.json();

  if (topicsRes.ok && topicsJson.success && topicsJson.data.length >= 10) {
    ok(`Themencluster (${topicsJson.data.length})`);
  } else {
    fail("Themencluster");
  }

  const createRes = await adminFetch("/api/admin/blog/posts", cookie, {
    method: "POST",
    body: JSON.stringify({
      title: "Testartikel Wurstgrundlagen",
      excerpt: "Kurzbeschreibung für Test",
      summary: "Dieser Testartikel erklärt Grundlagen zum Wurstmachen.",
      body: "## Einleitung\n\nWurst selber machen beginnt mit guten Rohstoffen.\n\n## Schritt für Schritt\n\n1. Fleisch vorbereiten\n2. Würzen\n3. Abfüllen\n\n## Fazit\n\nMit etwas Übung gelingt die erste Wurst sicher.",
      focusKeyword: "wurst selber machen",
    }),
  });
  const createJson = await createRes.json();

  if (!createRes.ok || !createJson.success) {
    fail("Artikel anlegen", createJson.error?.message);
    console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed > 0 ? 1 : 0);
  }

  ok("Artikel anlegen");
  const postId = createJson.data.id;

  const publicListRes = await fetch(`${BASE}/api/blog/posts`);
  const publicListJson = await publicListRes.json();

  if (publicListRes.ok && publicListJson.success) {
    ok("Öffentliche Artikelliste");
  } else {
    fail("Öffentliche Artikelliste");
  }

  const magazinRes = await fetch(`${BASE}/magazin`);
  if (magazinRes.ok) {
    ok("Magazin-Seite");
  } else {
    fail("Magazin-Seite", String(magazinRes.status));
  }

  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  if (sitemapRes.ok) {
    ok("Sitemap");
  } else {
    fail("Sitemap", String(sitemapRes.status));
  }

  const deleteRes = await adminFetch(`/api/admin/blog/posts/${postId}`, cookie, {
    method: "DELETE",
  });
  const deleteJson = await deleteRes.json();

  if (deleteRes.ok && deleteJson.success) {
    ok("Artikel löschen");
  } else {
    fail("Artikel löschen", deleteJson.error?.message);
  }

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
