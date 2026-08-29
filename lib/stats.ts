/**
 * Two complete weeks, compared. From nothing to something has no
 * percentage to report, so it goes unsaid rather than being called 100%.
 */
export function changeIn<K extends string>(weeks: Array<Record<K, number> & { week: string }>, key: K): number | undefined {
    if (weeks.length < 2) return undefined
    const previous = weeks[weeks.length - 2][key]
    const latest = weeks[weeks.length - 1][key]
    if (previous === 0) return undefined
    return Math.round(((latest - previous) / previous) * 1000) / 10
}

/** "24 Aug" style labels for a sparkline, oldest first. */
export function weekLabels(weeks: Array<{ week: string }>): string[] {
    return weeks.map((entry) => new Date(entry.week).toLocaleDateString(undefined, { day: "numeric", month: "short" }))
}
