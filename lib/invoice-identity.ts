/**
 * Our own legal details, as they must appear on an invoice.
 *
 * The API has no organisation or tenant endpoint, so there is nowhere to read
 * these from — they live here until one exists. Edit this file to change what
 * prints in the invoice header.
 */
export const INVOICE_ISSUER = {
    name: "Hyperspace",
    legalName: "Hyperspace SARL",
    addressLines: ["Rue Habib Bourguiba", "7000 Bizerte", "Tunisia"],
    taxId: "",
    registrationNumber: "",
    email: "",
    phone: "",
    /** Shown under the totals. Payment instructions, bank details, terms. */
    footerNote: "Payment due by the date shown above.",
} as const
