import { Suspense } from "react"
import { AddInvoiceButton } from "./add-invoice-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { InvoiceTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function InvoicesPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Invoices</h1>
                <AddInvoiceButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                <InvoiceTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
