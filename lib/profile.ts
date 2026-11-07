export const GENDERS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export function genderLabel(value: string | null | undefined) {
  return GENDERS.find((g) => g.value === value)?.label ?? null;
}

// Today's date in Bangladesh time, as numbers
function dhakaToday() {
  const d = new Date(Date.now() + 6 * 60 * 60 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

// Today as "2026-11-03" (used as the latest allowed birth date)
export function todayIso() {
  const t = dhakaToday();
  return `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
}

// "2000-05-17" -> the date, or null if it is not a real calendar date
export function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;

  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, da));

  const real =
    date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === da;
  return real ? date : null;
}

// "2000-05-17" -> age in years (counted in Bangladesh time), or null
export function ageFromIsoDate(iso: string): number | null {
  const date = parseIsoDate(iso);
  if (!date) return null;

  const t = dhakaToday();
  let age = t.y - date.getUTCFullYear();
  if (t.m < date.getUTCMonth() + 1 || (t.m === date.getUTCMonth() + 1 && t.d < date.getUTCDate()))
    age -= 1;

  return age;
}