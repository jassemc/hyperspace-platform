/**
 * The state every community server action returns, and the readers they
 * parse FormData with. Bookings and opportunities keep their own copies for
 * now; this file is the one the community modules share.
 */
export type ActionState = {
    success?: boolean
    error?: string
    /** RFC 9457 `type`, e.g. "membership_already_cancelled" — so the UI can react, not just report. */
    problemType?: string
    status?: number
}

/**
 * The generated client throws HttpError, whose `.message` is
 * `Status Code ${status}: ${detail}` and whose `.error` keeps the full
 * RFC 9457 payload. Reading only `.message` made every failure look like
 * a validation failure; `problemType` is what lets a form say what to do next.
 */
export function problem(error: unknown, fallback: string): ActionState {
    const http = error as { message?: string; status?: number; error?: { type?: string } }
    return {
        success: false,
        error: http?.message || fallback,
        problemType: http?.error?.type,
        status: http?.status,
    }
}

/** Trimmed string, or undefined when absent or blank. */
export function text(formData: FormData, field: string): string | undefined {
    const value = formData.get(field)
    return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * Like `text`, but an emptied field stays "" instead of vanishing. PATCH
 * endpoints assign on `!== undefined`, so `undefined` means "leave it alone",
 * which made clearing a note a silent no-op.
 */
export function clearableText(formData: FormData, field: string): string | undefined {
    const value = formData.get(field)
    return typeof value === "string" ? value.trim() : undefined
}

export function num(formData: FormData, field: string): number | undefined {
    const raw = text(formData, field)
    if (raw === undefined) return undefined
    const value = Number(raw)
    return Number.isFinite(value) ? value : undefined
}

/** A comma-separated field into a list; undefined when the field is blank. */
export function tags(formData: FormData, field = "tags"): string[] | undefined {
    const raw = text(formData, field)
    if (!raw) return undefined
    return raw.split(",").map((tag) => tag.trim()).filter(Boolean)
}
