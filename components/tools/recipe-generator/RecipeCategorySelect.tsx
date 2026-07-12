"use client";

/**
 * @file RecipeCategorySelect.tsx
 * @purpose Dropdown mit Kategorien aus dem Admin-Katalog.
 */

import { useEffect, useState } from "react";

import { selectClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  fetchRecipeCategories,
  type ApiRecipeCategory,
} from "@/lib/tools/recipe-client";

type RecipeCategorySelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

/**
 * Select mit aktiven Kategorien aus der API.
 */
export default function RecipeCategorySelect({
  id,
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Alle Kategorien",
}: RecipeCategorySelectProps) {
  const [categories, setCategories] = useState<ApiRecipeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetchRecipeCategories();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setCategories(response.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectClass = className ?? selectClassName;

  return (
    <select
      id={id}
      className={selectClass}
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty && <option value="">{loading ? "Laden …" : emptyLabel}</option>}
      {categories.map((category) => (
        <option key={category.id} value={category.name}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
