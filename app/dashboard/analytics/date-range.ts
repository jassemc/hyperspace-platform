import { firstParam } from "@/lib/search-params"

export interface DateRange {
    from: string
    to: string
}

/**
 * The analytics endpoints require an explicit window, so the page defaults to
 * the last 30 days when the URL does not name one.
 */
export function readDateRange(
    params: Record<string, string | string[] | undefined>,
    days = 30
): DateRange {
    const to = firstParam(params.to) ?? new Date().toISOString().slice(0, 10)
    const fromParam = firstParam(params.from)
    if (fromParam) return { from: fromParam, to }

    const start = new Date(to)
    start.setDate(start.getDate() - days)
    return { from: start.toISOString().slice(0, 10), to }
}
