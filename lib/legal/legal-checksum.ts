/**
 * @file legal-checksum.ts
 */

import { createHash } from "node:crypto";

export function computeLegalChecksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
