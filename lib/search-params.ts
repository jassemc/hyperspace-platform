export type SearchParamsInput =
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
    | undefined

/** Next gives repeated query keys as arrays; list pages only ever want the first. */
export function firstParam(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

export async function resolveSearchParams(
    searchParams: SearchParamsInput
): Promise<Record<string, string | string[] | undefined>> {
    const resolved = searchParams instanceof Promise ? await searchParams : searchParams
    return resolved ?? {}
}

export interface PageQuery {
    limit: number
    offset: number
    page: number
    pageSize: number
    q?: string
}

/** Shared paging + search parsing, matching what the shared DataTable writes. */
export function pageQuery(params: Record<string, string | string[] | undefined>): PageQuery {
    const page = Number(firstParam(params.page)) || 1
    const pageSize = Number(firstParam(params.pageSize)) || 10
    return {
        page,
        pageSize,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        q: firstParam(params.name) || undefined,
    }
}

/** Narrows a raw query value to a known enum member, or undefined. */
export function asEnum<T extends string>(
    value: string | undefined,
    allowed: readonly T[]
): T | undefined {
    return allowed.includes(value as T) ? (value as T) : undefined
}

/** A paginated envelope, once cast past the generic `PageDto.results`. */
export interface Paginated<T> {
    results?: T[]
    meta?: { totalItems?: number }
}

export function pageResult<T>(response: unknown): { results: T[]; total: number } {
    const page = response as Paginated<T>
    const results = page?.results ?? []
    return { results, total: page?.meta?.totalItems ?? results.length }
}
