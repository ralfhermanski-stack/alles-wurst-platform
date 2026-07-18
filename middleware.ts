import {
  canBypassMaintenance,
  isMaintenanceExemptPath,
} from "@/lib/maintenance/maintenance-bypass";
import {
  getMaintenanceCache,
  setMaintenanceCache,
} from "@/lib/maintenance/maintenance-cache";
import { resolveMaintenanceStatusProbeUrl } from "@/lib/maintenance/maintenance-probe-url";
import type { MaintenanceHttpStatus } from "@/lib/maintenance/maintenance-types";
import { isAnalyticsExcludeAdminsEnabled } from "@/lib/analytics/analytics-config";
import { shouldSkipAnalyticsPath } from "@/lib/analytics/analytics-middleware";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/session-token";
import {
  PAGE_EDITOR_PREVIEW_COOKIE,
  PAGE_EDITOR_PREVIEW_HEADER,
  PAGE_EDITOR_PREVIEW_QUERY,
} from "@/lib/page-editor/preview-token-constants";
import { applyPageEditorPreviewCookie } from "@/lib/page-editor/preview-cookie";
import { verifyPageEditorPreviewToken } from "@/lib/page-editor/preview-token-edge";
import { resolveInternalApiUrl } from "@/lib/http/internal-api-url";
import { findRoutePermission } from "@/lib/permissions/route-permissions";
import { getSecurityHeaders } from "@/lib/security/security-headers";

const PATHNAME_HEADER = "x-pathname";

function isAdminLikeRole(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

async function hasRouteAccess(
  request: NextRequest,
  session: SessionPayload,
  permissionKey: string,
  isAdminRoute: boolean,
): Promise<boolean> {
  if (isAdminLikeRole(session.systemRole)) {
    return true;
  }

  const apiPath = isAdminRoute
    ? "/api/admin/permissions/session"
    : "/api/account/permissions";

  try {
    // Wie Maintenance-Probe: nie über öffentliche HTTPS-URL self-fetchen.
    const url = resolveInternalApiUrl(apiPath, request);
    const response = await fetch(url, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const json = (await response.json()) as {
      data?: { permissionKeys?: string[]; isSuperAdmin?: boolean };
    };

    if (json.data?.isSuperAdmin) {
      return true;
    }

    const keys = new Set(json.data?.permissionKeys ?? []);
    return keys.has(permissionKey);
  } catch {
    return false;
  }
}

function forwardWithPathname(
  request: NextRequest,
  pathname: string,
  extraHeaders?: Headers,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  if (extraHeaders) {
    for (const [key, value] of extraHeaders.entries()) {
      requestHeaders.set(key, value);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders(process.env.NODE_ENV === "production");

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  response.headers.delete("X-Powered-By");
  return response;
}

const PUBLIC_WERKSTATT_PREFIXES = [
  "/werkstatt",
  "/werkstatt/salzrechner",
  "/werkstatt/empfehlungen",
];

async function hasAdminAreaAccess(
  request: NextRequest,
  session: SessionPayload,
): Promise<boolean> {
  if (isAdminLikeRole(session.systemRole)) {
    return true;
  }

  if (session.systemRole === "SUPPORT" || session.systemRole === "INSTRUCTOR") {
    return true;
  }

  try {
    const url = resolveInternalApiUrl("/api/admin/permissions/session", request);
    const response = await fetch(url, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const json = (await response.json()) as {
      success?: boolean;
      data?: { permissionKeys?: string[]; isSuperAdmin?: boolean };
    };

    if (json.data?.isSuperAdmin) {
      return true;
    }

    const keys = json.data?.permissionKeys ?? [];
    return keys.some((key) => key.startsWith("admin."));
  } catch {
    return false;
  }
}

async function getSessionPayload(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

async function fetchMaintenanceStatus(
  request: NextRequest,
): Promise<{ enabled: boolean; httpStatus: MaintenanceHttpStatus }> {
  const cached = getMaintenanceCache();

  if (cached) {
    return {
      enabled: cached.enabled,
      httpStatus: cached.httpStatus,
    };
  }

  try {
    const url = resolveMaintenanceStatusProbeUrl(request);
    const response = await fetch(url, {
      headers: { "x-maintenance-probe": "1" },
      cache: "no-store",
    });

    if (!response.ok) {
      return { enabled: false, httpStatus: "503" };
    }

    const data = (await response.json()) as {
      enabled?: boolean;
      httpStatus?: MaintenanceHttpStatus;
    };

    const enabled = Boolean(data.enabled);
    const httpStatus = data.httpStatus === "200" ? "200" : "503";

    setMaintenanceCache(enabled, httpStatus);

    return { enabled, httpStatus };
  } catch {
    return { enabled: false, httpStatus: "503" };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionPayload(request);

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/anmelden", request.url);
      loginUrl.searchParams.set("next", pathname);

      return NextResponse.redirect(loginUrl);
    }

    const isSupportArea = pathname.startsWith("/admin/support");
    const isBlogArea = pathname.startsWith("/admin/magazin");

    if (isSupportArea) {
      if (
        !isAdminLikeRole(session.systemRole) &&
        session.systemRole !== "SUPPORT"
      ) {
        return NextResponse.redirect(new URL("/mein-bereich", request.url));
      }
    } else if (isBlogArea) {
      if (
        !isAdminLikeRole(session.systemRole) &&
        session.systemRole !== "INSTRUCTOR"
      ) {
        return NextResponse.redirect(new URL("/mein-bereich", request.url));
      }
    } else if (session.systemRole && !isAdminLikeRole(session.systemRole)) {
      const allowed = await hasAdminAreaAccess(request, session);

      if (!allowed) {
        return NextResponse.redirect(new URL("/mein-bereich", request.url));
      }
    }

    const adminRoutePermission = findRoutePermission(pathname);

    if (
      adminRoutePermission &&
      !isAdminLikeRole(session.systemRole) &&
      !isSupportArea &&
      !isBlogArea
    ) {
      const hasAccess = await hasRouteAccess(
        request,
        session,
        adminRoutePermission.permissionKey,
        true,
      );

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/admin?error=forbidden", request.url));
      }
    }
  }

  if (pathname.startsWith("/werkstatt/")) {
    const isPublic = PUBLIC_WERKSTATT_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!isPublic && !session) {
      const loginUrl = new URL("/anmelden", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const routePermission = findRoutePermission(pathname);

  if (routePermission && session && pathname.startsWith("/werkstatt/")) {
    const isPublic = PUBLIC_WERKSTATT_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!isPublic) {
      const hasAccess = await hasRouteAccess(
        request,
        session,
        routePermission.permissionKey,
        false,
      );

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/werkstatt?error=forbidden", request.url));
      }
    }
  }

  // Mitgliederbereich: Middleware prüft nur Login.
  // Rechte (general.member-area.view etc.) prüft das Member-Layout per DB —
  // kein Self-Fetch, der in Produktion fehlschlagen und fälschlich forbidden liefern kann.
  if (pathname.startsWith("/mein-bereich") || pathname.startsWith("/account")) {
    if (!session) {
      const loginUrl = new URL("/anmelden", request.url);
      loginUrl.searchParams.set("next", pathname);

      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/anmelden" || pathname === "/registrieren" || pathname === "/login") {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/anmelden", request.url));
    }

    if (isAdminLikeRole(session?.systemRole)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (session?.systemRole === "USER") {
      const next = request.nextUrl.searchParams.get("next");

      if (next && next.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(new URL(next, request.url));
      }

      return NextResponse.redirect(new URL("/mein-bereich", request.url));
    }
  }

  if (!isMaintenanceExemptPath(pathname)) {
    const status = await fetchMaintenanceStatus(request);

    if (status.enabled) {
      if (!canBypassMaintenance(session)) {
        const rewriteUrl = new URL("/wartung", request.url);
        const rewrite = NextResponse.rewrite(rewriteUrl);

        if (status.httpStatus === "503") {
          rewrite.headers.set("Retry-After", "3600");
          return new NextResponse(rewrite.body, {
            status: 503,
            headers: rewrite.headers,
          });
        }

        return rewrite;
      }
    } else if (pathname === "/wartung") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (
    !shouldSkipAnalyticsPath(pathname) &&
    !pathname.startsWith("/admin") &&
    !(isAdminLikeRole(session?.systemRole) && isAnalyticsExcludeAdminsEnabled())
  ) {
    const basicUrl = new URL("/api/analytics/basic", request.url);

    void fetch(basicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ pathname, status: 200 }),
    }).catch(() => undefined);
  }

  const previewQueryToken = request.nextUrl.searchParams.get(
    PAGE_EDITOR_PREVIEW_QUERY,
  );

  if (previewQueryToken) {
    const queryPayload = await verifyPageEditorPreviewToken(previewQueryToken);

    if (
      queryPayload &&
      session &&
      isAdminLikeRole(session.systemRole) &&
      queryPayload.userId === session.userId
    ) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete(PAGE_EDITOR_PREVIEW_QUERY);

      const response = NextResponse.redirect(cleanUrl);
      applyPageEditorPreviewCookie(
        response,
        previewQueryToken,
        queryPayload.expiresAt,
      );

      return response;
    }
  }

  const previewToken = request.cookies.get(PAGE_EDITOR_PREVIEW_COOKIE)?.value;
  const previewPayload = previewToken
    ? await verifyPageEditorPreviewToken(previewToken)
    : null;

  if (
    previewPayload &&
    session &&
    isAdminLikeRole(session.systemRole) &&
    previewPayload.userId === session.userId
  ) {
    const previewHeaders = new Headers();
    previewHeaders.set(PAGE_EDITOR_PREVIEW_HEADER, previewPayload.pageId);

    return forwardWithPathname(request, pathname, previewHeaders);
  }

  return withSecurityHeaders(forwardWithPathname(request, pathname));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/mein-bereich/:path*",
    "/anmelden",
    "/registrieren",
    "/login",
    "/wartung",
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
