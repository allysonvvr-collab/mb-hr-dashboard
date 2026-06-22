// Shared ID-matching helper.
//
// Why this exists: Supabase/PostgREST serializes bigint and bigserial columns
// as STRINGS in JSON responses (to avoid precision loss on large 64-bit
// numbers in JavaScript). Our employees.id is bigserial and every *_employee_id
// foreign key is bigint — so depending on which value came from a fresh insert
// (a real JS number) vs. a re-fetched row (a string from Supabase), comparing
// them with strict equality (===) can silently fail even though both
// "look like" the same ID. This caused real bugs: an entry would save and
// count toward totals, but never visually attach to the right employee's row,
// with zero errors anywhere.
//
// Always use this instead of `a.id === b.id` when comparing any ID that
// touches Supabase data.
export function idsMatch(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}
