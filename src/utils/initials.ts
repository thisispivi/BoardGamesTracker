/**
 * Builds display initials from the first and last part of a person's name.
 *
 * Middle names are ignored so the result is always at most two characters, and
 * the name is split on any whitespace run. Characters are taken by code point so
 * a name outside the Basic Multilingual Plane is not cut in half.
 *
 * @param name - The full name as the account stores it.
 * @returns The uppercased initials, or an empty string when the name has none.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (first === undefined) return "";
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  const letters = [first, last]
    .filter((part): part is string => part !== undefined)
    .map((part) => [...part][0] ?? "")
    .join("");
  return letters.toUpperCase();
}
