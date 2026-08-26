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
