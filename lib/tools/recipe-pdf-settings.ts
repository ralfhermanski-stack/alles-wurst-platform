/**
 * @file recipe-pdf-settings.ts
 * @purpose Typen und Client-Hilfen für globale PDF-Einstellungen.
 */

export type RecipePdfSettings = {
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfLogoPlaceholder: string;
  pdfLegalNotice: string;
};

export const DEFAULT_RECIPE_PDF_SETTINGS: RecipePdfSettings = {
  pdfHeaderText: "Alles-Wurst Rezeptgenerator",
  pdfFooterText: "Erstellt mit dem Alles-Wurst Rezeptgenerator",
  pdfLogoPlaceholder: "Logo",
  pdfLegalNotice: "",
};

/**
 * Lädt die globalen PDF-Einstellungen (öffentliche API).
 */
export async function fetchRecipePdfSettings(): Promise<RecipePdfSettings> {
  try {
    const response = await fetch("/api/tools/recipes/pdf-settings");
    const json: unknown = await response.json();

    if (
      typeof json === "object" &&
      json !== null &&
      "success" in json &&
      json.success === true &&
      "data" in json &&
      typeof json.data === "object" &&
      json.data !== null
    ) {
      const data = json.data as RecipePdfSettings;

      return {
        pdfHeaderText: data.pdfHeaderText || DEFAULT_RECIPE_PDF_SETTINGS.pdfHeaderText,
        pdfFooterText: data.pdfFooterText || DEFAULT_RECIPE_PDF_SETTINGS.pdfFooterText,
        pdfLogoPlaceholder:
          data.pdfLogoPlaceholder || DEFAULT_RECIPE_PDF_SETTINGS.pdfLogoPlaceholder,
        pdfLegalNotice: data.pdfLegalNotice ?? "",
      };
    }
  } catch {
    // Fallback auf Defaults
  }

  return DEFAULT_RECIPE_PDF_SETTINGS;
}
