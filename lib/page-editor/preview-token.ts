/**
 * @deprecated Importiere aus preview-token-edge.ts oder preview-token-constants.ts.
 */

export {
  PAGE_EDITOR_PREVIEW_COOKIE,
  PAGE_EDITOR_PREVIEW_HEADER,
  PAGE_EDITOR_TOKEN_TTL_MS,
} from "./preview-token-constants";

export {
  createPageEditorPreviewToken,
  generatePageEditorPlainToken,
  verifyPageEditorPreviewToken,
} from "./preview-token-edge";
