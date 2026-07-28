/**
 * Utility untuk memformat nama ke format Title Case (Kapital di setiap awal kata).
 * Contoh: "haikal mabrur" -> "Haikal Mabrur", "HAIKAL MABRUR" -> "Haikal Mabrur"
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
