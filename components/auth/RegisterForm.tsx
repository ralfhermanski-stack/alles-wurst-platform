"use client";

/**
 * @file RegisterForm.tsx
 * @purpose Registrierungsformular mit vollständiger Adresse.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { registerApi } from "@/lib/auth/auth-client";
import {
  getStoredRecipeUserId,
  setRecipeUserId,
} from "@/lib/tools/recipe-session";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function RegisterForm({
  defaultEmail = "",
  inviteToken,
  emailReadOnly = false,
}: {
  defaultEmail?: string;
  inviteToken?: string;
  emailReadOnly?: boolean;
}) {
  const router = useRouter();

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("DE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const recipeUserId = getStoredRecipeUserId() ?? undefined;

    const response = await registerApi({
      email,
      password,
      recipeUserId,
      inviteToken,
      profile: {
        salutation: salutation || null,
        firstName,
        lastName,
        company: company || null,
        phone: phone || null,
        address: {
          street,
          houseNumber,
          addressLine2: addressLine2 || null,
          postalCode,
          city,
          stateRegion: stateRegion || null,
          country,
        },
      },
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipeUserId(response.data.user.id);
    router.push(inviteToken ? "/mein-bereich/betatest" : "/mein-bereich");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
      {error && (
        <p
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">Zugangsdaten</h2>

        <div>
          <label htmlFor="reg-email" className={labelClassName}>
            E-Mail
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            readOnly={emailReadOnly}
            className={`${inputClassName} mt-2 ${emailReadOnly ? "opacity-80" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-password" className={labelClassName}>
              Passwort
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={`${inputClassName} mt-2`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-aw-muted">Mindestens 8 Zeichen</p>
          </div>
          <div>
            <label htmlFor="reg-password-confirm" className={labelClassName}>
              Passwort bestätigen
            </label>
            <input
              id="reg-password-confirm"
              type="password"
              autoComplete="new-password"
              required
              className={`${inputClassName} mt-2`}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">Persönliche Daten</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="reg-salutation" className={labelClassName}>
              Anrede
            </label>
            <select
              id="reg-salutation"
              className={`${selectClassName} mt-2`}
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
            >
              <option value="">—</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
              <option value="Divers">Divers</option>
            </select>
          </div>
          <div>
            <label htmlFor="reg-first-name" className={labelClassName}>
              Vorname *
            </label>
            <input
              id="reg-first-name"
              required
              className={`${inputClassName} mt-2`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-last-name" className={labelClassName}>
              Nachname *
            </label>
            <input
              id="reg-last-name"
              required
              className={`${inputClassName} mt-2`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-company" className={labelClassName}>
              Firma (optional)
            </label>
            <input
              id="reg-company"
              className={`${inputClassName} mt-2`}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className={labelClassName}>
              Telefon (optional)
            </label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              className={`${inputClassName} mt-2`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">Adresse</h2>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label htmlFor="reg-street" className={labelClassName}>
              Straße *
            </label>
            <input
              id="reg-street"
              required
              autoComplete="street-address"
              className={`${inputClassName} mt-2`}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-house-number" className={labelClassName}>
              Nr. *
            </label>
            <input
              id="reg-house-number"
              required
              className={`${inputClassName} mt-2`}
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-address-line2" className={labelClassName}>
            Adresszusatz (optional)
          </label>
          <input
            id="reg-address-line2"
            className={`${inputClassName} mt-2`}
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="reg-postal-code" className={labelClassName}>
              PLZ *
            </label>
            <input
              id="reg-postal-code"
              required
              autoComplete="postal-code"
              className={`${inputClassName} mt-2`}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="reg-city" className={labelClassName}>
              Ort *
            </label>
            <input
              id="reg-city"
              required
              autoComplete="address-level2"
              className={`${inputClassName} mt-2`}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-state" className={labelClassName}>
              Bundesland (optional)
            </label>
            <input
              id="reg-state"
              className={`${inputClassName} mt-2`}
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-country" className={labelClassName}>
              Land
            </label>
            <input
              id="reg-country"
              required
              autoComplete="country"
              className={`${inputClassName} mt-2`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <p className="text-xs text-aw-muted">
        Bestehende Rezepte aus dem Rezeptgenerator werden nach der Registrierung
        automatisch mit deinem Konto verknüpft.
      </p>

      <button
        type="submit"
        className={`${primaryButtonClassName} w-full`}
        disabled={loading}
      >
        {loading ? "Registrierung …" : "Konto erstellen"}
      </button>

      <p className="text-center text-sm text-aw-muted">
        Bereits registriert?{" "}
        <Link href="/anmelden" className="font-semibold text-aw-gold hover:text-aw-cream">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
