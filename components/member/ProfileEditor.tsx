"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { changePasswordApi } from "@/lib/auth/auth-client";
import {
  fetchMyProfileApi,
  removeMyAvatarApi,
  updateMyProfileApi,
  uploadMyAvatarApi,
  type MyProfileResponse,
} from "@/lib/users/user-profile-client";
import type { UserProfileInput } from "@/lib/users/user-types";

import ProfileAvatarUpload from "@/components/member/ProfileAvatarUpload";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ProfileEditorProps = {
  email: string;
  onProfileUpdated: () => Promise<void>;
};

function normalizeNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export default function ProfileEditor({
  email,
  onProfileUpdated,
}: ProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [, setProfile] = useState<MyProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [publicName, setPublicName] = useState<string | null>(null);
  const [salutation, setSalutation] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [addressLine2, setAddressLine2] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("DE");

  const passwordForm = useMemo(
    () => ({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
    [],
  );

  const [currentPassword, setCurrentPassword] = useState(passwordForm.currentPassword);
  const [newPassword, setNewPassword] = useState(passwordForm.newPassword);
  const [confirmPassword, setConfirmPassword] = useState(
    passwordForm.confirmPassword,
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError(null);

      const response = await fetchMyProfileApi();
      if (!active) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setLoading(false);
        return;
      }

      setProfile(response.data);

      const p: UserProfileInput = response.data;

      setFirstName(p.firstName);
      setLastName(p.lastName);
      setPublicName(p.publicName ?? null);
      setSalutation(p.salutation ?? null);
      setCompany(p.company ?? null);
      setPhone(p.phone ?? null);
      setAvatarUrl(p.avatarUrl ?? null);
      setAvatarFileName(p.avatarFileName ?? null);
      setBio(p.bio ?? null);

      setStreet(p.address.street);
      setHouseNumber(p.address.houseNumber);
      setAddressLine2(p.address.addressLine2 ?? null);
      setPostalCode(p.address.postalCode);
      setCity(p.address.city);
      setStateRegion(p.address.stateRegion ?? null);
      setCountry(p.address.country ?? "DE");

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Vorname und Nachname sind erforderlich.");
      return;
    }

    const normalizedPublicName = publicName?.trim() ?? null;
    const PUBLIC_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

    if (normalizedPublicName) {
      if (normalizedPublicName.length < 3 || normalizedPublicName.length > 30) {
        setError(
          "Der öffentliche Anzeigename muss zwischen 3 und 30 Zeichen lang sein.",
        );
        return;
      }

      if (!PUBLIC_NAME_REGEX.test(normalizedPublicName)) {
        setError(
          "Der öffentliche Anzeigename darf nur Buchstaben, Zahlen und Unterstrich enthalten.",
        );
        return;
      }
    }

    if (
      !street.trim() ||
      !houseNumber.trim() ||
      !postalCode.trim() ||
      !city.trim()
    ) {
      setError("Adresse ist unvollständig.");
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const next: UserProfileInput = {
      salutation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      publicName: normalizedPublicName,
      ...(avatarUrl?.startsWith("/api/users/")
        ? {}
        : { avatarUrl: avatarUrl?.trim() ?? null }),
      bio: bio?.trim() ?? null,
      company,
      phone,
      address: {
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        addressLine2: addressLine2,
        postalCode: postalCode.trim(),
        city: city.trim(),
        stateRegion,
        country: country.trim() || "DE",
      },
    };

    const response = await updateMyProfileApi(next);
    setSavingProfile(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Profil gespeichert.");
    setProfile(response.data);
    await onProfileUpdated();
  }

  async function handleAvatarUpload(file: File): Promise<boolean> {
    setError(null);
    setSuccess(null);

    const response = await uploadMyAvatarApi(file);

    if (!response.success) {
      setError(response.error.message);
      return false;
    }

    setAvatarUrl(response.data.avatarUrl);
    setAvatarFileName(response.data.avatarFileName);
    setSuccess("Profilbild hochgeladen.");
    await onProfileUpdated();
    return true;
  }

  async function handleAvatarRemove(): Promise<boolean> {
    setError(null);
    setSuccess(null);

    const response = await removeMyAvatarApi();

    if (!response.success) {
      setError(response.error.message);
      return false;
    }

    setAvatarUrl(null);
    setAvatarFileName(null);
    setSuccess("Profilbild entfernt.");
    await onProfileUpdated();
    return true;
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    const response = await changePasswordApi({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setSavingPassword(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess(response.data.message);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <p className="text-sm text-aw-muted">Profil wird geladen …</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-aw-success" role="status">
          {success}
        </p>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-xl font-bold text-aw-cream">
          Profil bearbeiten
        </h2>
        <p className="mt-1 text-sm text-aw-muted">
          Dieser Name wird öffentlich angezeigt, z. B. im Forum, bei Kommentaren und Bewertungen. Dein Klarname bleibt privat.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Vorname *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName}>Nachname *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClassName}>
              Anzeigename / Benutzername
            </label>
            <input
              className={`${inputClassName} mt-2`}
              value={publicName ?? ""}
              onChange={(e) =>
                setPublicName(e.target.value.trim() === "" ? null : e.target.value)
              }
              placeholder="z. B. Wurstfreund42"
            />
            <p className="mt-2 text-xs text-aw-muted">
              Max. 30 Zeichen. Nur Buchstaben, Zahlen und Unterstrich.
            </p>
          </div>

          <div>
            <label className={labelClassName}>Anrede (optional)</label>
            <select
              className={`${selectClassName} mt-2`}
              value={salutation ?? ""}
              onChange={(e) => setSalutation(normalizeNullable(e.target.value))}
            >
              <option value="">—</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
              <option value="Divers">Divers</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Firma (optional)</label>
            <input
              className={`${inputClassName} mt-2`}
              value={company ?? ""}
              onChange={(e) => setCompany(normalizeNullable(e.target.value))}
            />
          </div>

          <div>
            <label className={labelClassName}>Telefon (optional)</label>
            <input
              className={`${inputClassName} mt-2`}
              value={phone ?? ""}
              onChange={(e) => setPhone(normalizeNullable(e.target.value))}
            />
          </div>

          <ProfileAvatarUpload
            profile={{ publicName, firstName }}
            avatarUrl={avatarUrl}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
          />

          <div>
            <label className={labelClassName}>Avatar-URL (optional, extern)</label>
            <input
              className={`${inputClassName} mt-2`}
              value={
                avatarUrl?.startsWith("/api/users/") ? "" : (avatarUrl ?? "")
              }
              onChange={(e) =>
                setAvatarUrl(e.target.value.trim() === "" ? null : e.target.value)
              }
              placeholder="https://… (alternativ zum Upload)"
              disabled={Boolean(avatarUrl?.startsWith("/api/users/"))}
            />
            {avatarFileName && (
              <p className="mt-2 text-xs text-aw-muted">
                Hochgeladen: {avatarFileName}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClassName}>Bio / Profilbeschreibung (optional)</label>
            <textarea
              className={`${inputClassName} mt-2 min-h-24`}
              value={bio ?? ""}
              onChange={(e) => setBio(normalizeNullable(e.target.value))}
              placeholder="Kurz & knackig – max. 300 Zeichen."
              maxLength={300}
            />
          </div>

          <div>
            <label className={labelClassName}>E-Mail</label>
            <input
              className={`${inputClassName} mt-2`}
              value={email}
              disabled
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h3 className="font-display text-lg font-bold text-aw-cream">
          Adresse
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClassName}>Straße *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName}>Nr. *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName}>PLZ *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName}>Ort *</label>
            <input
              className={`${inputClassName} mt-2`}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName}>Zusatz (optional)</label>
            <input
              className={`${inputClassName} mt-2`}
              value={addressLine2 ?? ""}
              onChange={(e) => setAddressLine2(normalizeNullable(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClassName}>Region (optional)</label>
            <input
              className={`${inputClassName} mt-2`}
              value={stateRegion ?? ""}
              onChange={(e) => setStateRegion(normalizeNullable(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName}>Land</label>
            <input
              className={`${inputClassName} mt-2`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={savingProfile}
          onClick={() => void handleSaveProfile()}
        >
          {savingProfile ? "Speichern …" : "Profil speichern"}
        </button>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h3 className="font-display text-lg font-bold text-aw-cream">
          Passwort ändern
        </h3>

        <form className="mt-5 space-y-4" onSubmit={handleChangePassword}>
          <div>
            <label className={labelClassName}>Aktuelles Passwort *</label>
            <input
              type="password"
              className={`${inputClassName} mt-2`}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Neues Passwort *</label>
              <input
                type="password"
                className={`${inputClassName} mt-2`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className={labelClassName}>
                Neues Passwort wiederholen *
              </label>
              <input
                type="password"
                className={`${inputClassName} mt-2`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={secondaryButtonClassName}
              disabled={savingPassword}
            >
              {savingPassword ? "Wird gespeichert …" : "Passwort ändern"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

