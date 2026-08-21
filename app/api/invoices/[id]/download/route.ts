import { hsService } from "@/lib/service/api"
import type { InvoiceDto } from "@/lib/service/HsService"

/**
 * Proxies GET /invoices/{id}/download so the browser can save the API's PDF.
 *
 * The generated client is server-only, so the download cannot be linked
 * directly from the page. It is also called through `hsService` rather than the
 * `lib/service` wrapper: that wrapper is marked "use server", and a server
 * action cannot return a stream.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // The attachment is named after the invoice number, so it is read first.
    const [invoice, body] = await Promise.all([
      hsService.api.getInvoice(id) as Promise<InvoiceDto>,
      hsService.api.downloadInvoicePdf(id),
    ])

    // No `format` is set on the operation, so the client hands back the raw body.
    const stream = body as unknown as ReadableStream<Uint8Array>
    const filename = `${invoice?.number ?? id}.pdf`

    return new Response(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.warn(`Failed to download invoice ${id}`, error)
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 502
    return new Response("Could not generate the invoice PDF.", {
      status: Number.isFinite(status) && status >= 400 ? status : 502,
    })
  }
}
