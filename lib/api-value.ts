/**
 * Readers for API fields whose generated type lost its real shape.
 *
 * 38 nullable properties across the spec are declared as a bare `object` rather
 * than as a nullable string/number — `InvoiceDto.memberId`, every id on
 * `ChargeDto`, most of `OpportunityDto`, and so on. They carry uuids, strings
 * and numbers at runtime; the type just does not say so.
 *
 * These helpers keep the cast in one documented place instead of scattering
 * `as unknown as string` through the pages. When the backend fixes the schema
 * and the client is regenerated, the call sites can read the field directly and
 * this module can go.
 *
 * See docs/backend-api-issues.md.
 */

export function apiString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null
}

export function apiNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** Resolves a possibly-untyped id against a name lookup. */
export function apiName(value: unknown, names: Record<string, string>): string | null {
    const id = apiString(value)
    return id ? names[id] ?? null : null
}
