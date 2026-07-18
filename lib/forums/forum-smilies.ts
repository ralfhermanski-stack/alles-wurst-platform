/**
 * @file forum-smilies.ts
 * @purpose Klassische Smiley-Shortcodes für Forenbeiträge.
 */

export type ForumSmiley = {
  code: string;
  emoji: string;
  label: string;
};

/**
 * Längere Codes zuerst (z. B. `:thumbsup:` vor `:*`, `:-)` vor `:)`).
 * Kein `:/` — würde `http://` zerstören.
 */
export const FORUM_SMILIES: ForumSmiley[] = [
  { code: ":thumbsup:", emoji: "👍", label: "Daumen hoch" },
  { code: ":fire:", emoji: "🔥", label: "Feuer" },
  { code: ":-)", emoji: "🙂", label: "Lächeln" },
  { code: ":-D", emoji: "😃", label: "Grinsen" },
  { code: ";-)", emoji: "😉", label: "Zwinkern" },
  { code: ":-(", emoji: "😞", label: "Traurig" },
  { code: ":-P", emoji: "😛", label: "Zunge" },
  { code: ":-O", emoji: "😮", label: "Überraschung" },
  { code: ":-|", emoji: "😐", label: "Neutral" },
  { code: ":-*", emoji: "😘", label: "Kuss" },
  { code: ":)", emoji: "🙂", label: "Lächeln" },
  { code: ":D", emoji: "😃", label: "Grinsen" },
  { code: ";)", emoji: "😉", label: "Zwinkern" },
  { code: ":(", emoji: "😞", label: "Traurig" },
  { code: ":P", emoji: "😛", label: "Zunge" },
  { code: ":p", emoji: "😛", label: "Zunge" },
  { code: ":O", emoji: "😮", label: "Überraschung" },
  { code: ":|", emoji: "😐", label: "Neutral" },
  { code: ":*", emoji: "😘", label: "Kuss" },
  { code: "<3", emoji: "❤️", label: "Herz" },
];

/** Einzigartige Einträge für den Composer-Picker (ohne Doppel-Codes). */
export const FORUM_SMILEY_PICKER: ForumSmiley[] = [
  { code: ":)", emoji: "🙂", label: "Lächeln" },
  { code: ":D", emoji: "😃", label: "Grinsen" },
  { code: ";)", emoji: "😉", label: "Zwinkern" },
  { code: ":(", emoji: "😞", label: "Traurig" },
  { code: ":P", emoji: "😛", label: "Zunge" },
  { code: ":O", emoji: "😮", label: "Überraschung" },
  { code: ":|", emoji: "😐", label: "Neutral" },
  { code: ":*", emoji: "😘", label: "Kuss" },
  { code: "<3", emoji: "❤️", label: "Herz" },
  { code: ":thumbsup:", emoji: "👍", label: "Daumen hoch" },
  { code: ":fire:", emoji: "🔥", label: "Feuer" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ersetzt Shortcodes durch Emoji. Bereits geparstes Markdown bleibt unberührt,
 * wenn nur auf Plain-Text-Segmente angewendet.
 */
export function replaceForumSmilies(text: string): string {
  let result = text;

  for (const smiley of FORUM_SMILIES) {
    result = result.replaceAll(smiley.code, smiley.emoji);
  }

  return result;
}

/** Regex für alle Shortcodes (für Tokenisierung im Markdown-Renderer). */
export function buildSmileyPattern(): RegExp {
  const codes = FORUM_SMILIES.map((s) => escapeRegExp(s.code)).join("|");
  return new RegExp(`(${codes})`, "g");
}
