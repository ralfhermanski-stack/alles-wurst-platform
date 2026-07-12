/**
 * @file permission-resolver.ts
 * @purpose Auflösung effektiver Berechtigungen mit Prioritätslogik.
 */

import type { PermissionEffect } from "@prisma/client";

import type {
  EffectivePermissionMap,
  PermissionResolutionSource,
  ResolvedPermission,
} from "./permission-types";

export type PermissionGrantInput = {
  permissionKey: string;
  effect: PermissionEffect;
  source: PermissionResolutionSource;
  sourceLabel: string;
  groupId?: string;
  groupName?: string;
  priority: number;
};

const SOURCE_PRIORITY: Record<PermissionResolutionSource, number> = {
  user_deny: 700,
  user_allow: 600,
  group_deny: 500,
  group_allow: 400,
  membership: 300,
  system_role: 200,
  system_default: 100,
  none: 0,
};

function isDeny(effect: PermissionEffect): boolean {
  return effect === "DENY";
}

export function resolveEffectivePermissions(
  grants: PermissionGrantInput[],
): EffectivePermissionMap {
  const byKey = new Map<string, PermissionGrantInput[]>();

  for (const grant of grants) {
    const list = byKey.get(grant.permissionKey) ?? [];
    list.push(grant);
    byKey.set(grant.permissionKey, list);
  }

  const result: EffectivePermissionMap = new Map();

  for (const [key, entries] of byKey) {
    const sorted = [...entries].sort((a, b) => {
      const sourceDiff = SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source];
      if (sourceDiff !== 0) {
        return sourceDiff;
      }

      return b.priority - a.priority;
    });

    const winner = sorted[0];
    result.set(key, {
      key,
      allowed: !isDeny(winner.effect),
      source: winner.source,
      sourceLabel: winner.sourceLabel,
      groupId: winner.groupId,
      groupName: winner.groupName,
    });
  }

  return result;
}

export function isPermissionAllowed(
  map: EffectivePermissionMap,
  permissionKey: string,
): boolean {
  return map.get(permissionKey)?.allowed === true;
}

export function explainPermission(
  map: EffectivePermissionMap,
  permissionKey: string,
): ResolvedPermission | null {
  return map.get(permissionKey) ?? null;
}

export function hasAnyPermission(
  map: EffectivePermissionMap,
  keys: string[],
): boolean {
  return keys.some((key) => isPermissionAllowed(map, key));
}

export function hasAllPermissions(
  map: EffectivePermissionMap,
  keys: string[],
): boolean {
  return keys.every((key) => isPermissionAllowed(map, key));
}
