"use client";

/**
 * @file RecipeDecimalInput.tsx
 * @purpose Dezimal-Eingabe mit Komma/Punkt, ohne Abschneiden beim Tippen.
 */

import { useEffect, useState } from "react";

type RecipeDecimalInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  /** Leer/0 als leeres Feld anzeigen (Standard: true) */
  emptyWhenZero?: boolean;
};

function formatDecimalDisplay(value: number, emptyWhenZero: boolean): string {
  if (!Number.isFinite(value) || (emptyWhenZero && value === 0)) {
    return "";
  }

  return String(value).replace(".", ",");
}

function isTypingDecimal(raw: string): boolean {
  return raw === "" || /^-?\d*[.,]?\d*$/.test(raw);
}

/**
 * Parst eine abgeschlossene Dezimalzahl (Komma oder Punkt).
 * Unvollständige Eingaben wie "1," liefern null.
 */
export function parseRecipeDecimal(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === ",") {
    return null;
  }

  if (/[.,]$/.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(",", ".");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Textfeld für Dezimalwerte (z. B. 1,8 g/kg Pfeffer).
 */
export default function RecipeDecimalInput({
  id,
  value,
  onChange,
  className,
  placeholder,
  emptyWhenZero = true,
}: RecipeDecimalInputProps) {
  const [text, setText] = useState(() =>
    formatDecimalDisplay(value, emptyWhenZero),
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(formatDecimalDisplay(value, emptyWhenZero));
    }
  }, [value, emptyWhenZero, focused]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseRecipeDecimal(text);

        if (parsed === null) {
          onChange(0);
          setText(formatDecimalDisplay(0, emptyWhenZero));
          return;
        }

        onChange(parsed);
        setText(formatDecimalDisplay(parsed, emptyWhenZero));
      }}
      onChange={(e) => {
        const next = e.target.value;

        if (!isTypingDecimal(next)) {
          return;
        }

        setText(next);
        const parsed = parseRecipeDecimal(next);

        if (parsed !== null) {
          onChange(parsed);
        } else if (next.trim() === "") {
          onChange(0);
        }
      }}
    />
  );
}
