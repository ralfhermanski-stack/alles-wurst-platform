/**
 * @file page-editor-session-hash.ts
 * @purpose Token-Hashing nur für Node.js-API-Routen.
 */

import { createHash } from "node:crypto";

export function hashPageEditorPlainToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
