import pronunciation from "./pronunciation.json";

/** Convert name spelling for AUDIO ONLY. The UI keeps the real spelling. */
export function toSpokenText(text: string): string {
  const fullName = /\bChirag\s+Nayaka\s+M\.?\s*S\.?\b/gi;
  return text
    .replace(fullName, pronunciation.spokenFullName)
    .replace(/\bChirag\b/gi, pronunciation.spokenFirstName);
}
