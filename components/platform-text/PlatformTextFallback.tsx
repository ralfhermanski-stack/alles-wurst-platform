"use client";

import type { ElementType } from "react";

import { getPlatformTextDefault } from "@/lib/platform-text/platform-text-defaults";

type PlatformTextFallbackProps = {
  textKey: string;
  fallback?: string;
  as?: ElementType;
  className?: string;
};

/**
 * Client-sichere Textausgabe mit Registry-Fallback (ohne Server- oder DB-Abruf).
 */
export default function PlatformTextFallback({
  textKey,
  fallback,
  as: Tag = "span",
  className,
}: PlatformTextFallbackProps) {
  const registry = getPlatformTextDefault(textKey);
  const value = registry?.defaultValue ?? fallback ?? textKey;

  return <Tag className={className}>{value}</Tag>;
}
