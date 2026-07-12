"use client";

/**
 * @file MembershipRolePrototype.tsx
 * @purpose Prototyp-Umschalter für Mitgliedschaftsrollen (bis echte Auth).
 */

import { useState, useEffect, type FormEvent } from "react";

import {
  MEMBERSHIP_ROLE_DESCRIPTIONS,
  MEMBERSHIP_ROLE_LABELS,
} from "@/lib/membership/membership-labels";
import {
  DEFAULT_MEMBERSHIP_ROLE,
  MEMBERSHIP_ROLES,
  type MembershipRole,
} from "@/lib/membership/membership-rules";
import {
  setMembershipAccessBlocked,
  setMembershipRole,
  isMembershipAccessBlocked,
  getMembershipRole,
} from "@/lib/membership/membership-session";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";

const selectClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream";

/**
 * Dev-/Prototyp-Panel zum Testen von Mitgliedschaftsstufen.
 */
export default function MembershipRolePrototype() {
  const membership = useMembershipAccess();
  const [role, setRole] = useState<MembershipRole>(DEFAULT_MEMBERSHIP_ROLE);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setRole(getMembershipRole());
    setBlocked(isMembershipAccessBlocked());
  }, []);

  function handleApply(event: FormEvent) {
    event.preventDefault();
    setMembershipRole(role);
    setMembershipAccessBlocked(blocked);
    membership.refresh();
  }

  return (
    <form
      onSubmit={handleApply}
      className="rounded-xl border border-dashed border-aw-border bg-aw-surface/40 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-aw-muted">
        Prototyp — Mitgliedschaft simulieren
      </p>
      <p className="mt-1 text-xs text-aw-muted">
        Bis echte Auth und Zahlung angebunden sind, wird die Rolle lokal
        gespeichert und per API-Header mitgesendet.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="membership-role" className="text-xs text-aw-muted">
            Rolle / Stufe
          </label>
          <select
            id="membership-role"
            className={`${selectClassName} mt-1`}
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
          >
            {MEMBERSHIP_ROLES.map((item) => (
              <option key={item} value={item}>
                {MEMBERSHIP_ROLE_LABELS[item]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-aw-muted">
            {MEMBERSHIP_ROLE_DESCRIPTIONS[role]}
          </p>
        </div>

        <div className="flex flex-col justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={blocked}
              onChange={(e) => setBlocked(e.target.checked)}
              className="rounded border-aw-border"
            />
            Rezept-/Club-Zugriff gesperrt (Buchhaltung)
          </label>
          <button
            type="submit"
            className="rounded-lg border border-aw-border px-4 py-2 text-sm font-semibold text-aw-cream hover:border-aw-gold/50"
          >
            Rolle anwenden
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-aw-muted">
        Aktiv: <strong className="text-aw-cream">{MEMBERSHIP_ROLE_LABELS[membership.role]}</strong>
        {membership.accessBlocked ? " · Zugriff gesperrt" : ""}
      </p>
    </form>
  );
}
