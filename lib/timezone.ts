/**
 * The one place the deployment's business timezone is named (#74 / S-10).
 *
 * `Africa/Tunis` was hard-coded in four places outside the generated
 * client — a date helper, a location form's default and placeholder, and
 * a drawer's help text — so the platform would silently disagree with
 * the backend the day a location's timezone changed. Locations carry a
 * `timezone` column; `primaryTimeZone()` in lib/locations.ts reads it,
 * and everything that can await it should use that instead.
 *
 * This constant is the fallback for the places that cannot: a synchronous
 * date default, and the suggested value when CREATING the first location
 * (which has no timezone yet by definition).
 */
export const DEFAULT_TIMEZONE =
  process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE?.trim() || "Africa/Tunis"
