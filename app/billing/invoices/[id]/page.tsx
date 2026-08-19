import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getInvoice, getMember, getCompany } from "@/lib/service"
import type { CompanyDto, InvoiceDto, MemberDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import { Button } from "@/components/ui/button"
import { InvoiceDocument } from "./invoice-document"
import { PrintButton } from "./print-button"

export default async function InvoicePage({
    params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = await params

    let invoice: InvoiceDto
    try {
        invoice = (await getInvoice(id)) as InvoiceDto
    } catch (error) {
        console.warn(`Failed to load invoice ${id}`, error)
        notFound()
    }

    // The invoice carries its customer as an id only, and only one of the two.
    const memberId = apiString(invoice.memberId)
    const companyId = apiString(invoice.companyId)

    const [member, company] = await Promise.all([
        memberId ? (getMember(memberId).catch(() => null) as Promise<MemberDto | null>) : null,
        companyId ? (getCompany(companyId).catch(() => null) as Promise<CompanyDto | null>) : null,
    ])

    return (
        <div className="w-full py-6">
            {/* Screen-only chrome — the print stylesheet drops it. */}
            <div className="flex items-center justify-between gap-4 px-4 pb-6 print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/billing/invoices">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to invoices
                    </Link>
                </Button>
                <PrintButton />
            </div>

            <div className="px-4 print:px-0">
                <InvoiceDocument invoice={invoice} member={member} company={company} />
            </div>
        </div>
    )
}
