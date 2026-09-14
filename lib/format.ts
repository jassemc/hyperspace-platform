/**
 * Money and rate formatting for the API's current units.
 *
 * Prices are dinars (TND) excluding VAT — `240` is 240 TND, not millimes — and
 * VAT is a plain percentage (`19` is 19%, `20.5` is 20.5%). The API used to
 * express both in minor units (millimes, basis points); anything still dividing
 * by 1000 or 100 is stale.
 */

const PRICE_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
})

/** Price excluding VAT, e.g. `240 TND`. */
export function formatPriceHt(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "-"
    return `${PRICE_FORMAT.format(value)} TND`
}

/** VAT rate as a percentage, e.g. `19%`. */
export function formatVatRate(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "-"
    return `${PRICE_FORMAT.format(value)}%`
}

/** Price including VAT, derived from the HT price and the VAT percentage. */
export function priceTtc(priceHt: number, vatRate: number): number {
    return priceHt * (1 + vatRate / 100)
}

/** Turns a snake_case or kebab-case API enum into a readable label. */
export function formatEnumLabel(value: string): string {
    return value.replaceAll("-", " ").replaceAll("_", " ")
}

/** Short date for table cells; `-` when the value is missing or unparseable. */
export function formatDate(value: string | null | undefined): string {
    if (!value) return "-"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString()
}

/**
 * A plain YYYY-MM-DD calendar date (a requested day, a validity bound) —
 * read as a local date, never as UTC midnight, so it cannot slip to the day
 * before in a browser west of Greenwich. `-` when missing or unparseable.
 */
export function formatCalendarDate(value: string | null | undefined): string {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-").map(Number)
    if (!year || !month || !day) return "-"
    return new Date(year, month - 1, day).toLocaleDateString()
}

/** The business date in Tunis, not the browser's, since the API works in it. */
export function todayInTunis(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date())
}

/**
 * Date and time in a given zone. `timeZone` is required, not defaulted:
 * a default is how a single region creeps back into a multi-region
 * product. Callers take it from the location the value belongs to.
 */
export function formatDateTime(
    value: string | null | undefined,
    timeZone: string
): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

/** Weekday and calendar date in a zone, e.g. `Thu 27 Aug 2026`. */
export function formatDayLabel(
    value: string | null | undefined,
    timeZone: string
): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date)
}

/** Calendar day key in a zone (`2026-08-27`), for same-day comparisons. */
export function dayKey(value: string, timeZone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value))
}

/** Just the clock time, for calendar axes and block labels. */
export function formatTimeOfDay(
    value: string | null | undefined,
    timeZone: string
): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(date)
}

/**
 * "2 h ago", "yesterday", "3 d ago" — the coarse reading the desk wants
 * beside an absolute timestamp (#87 / O-01). Deliberately blunt: this
 * answers "did this come in over the weekend?", not "exactly when".
 *
 * `now` is injectable so the behaviour can be tested without freezing
 * the clock.
 */
export function formatRelativeTime(
  value: string | null | undefined,
  now: Date = new Date()
): string {
  if (!value) return "-"
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return "-"

  const seconds = Math.round((now.getTime() - then.getTime()) / 1000)
  if (seconds < 0) return "just now"
  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} d ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo ago`

  return `${Math.floor(months / 12)} y ago`
}
