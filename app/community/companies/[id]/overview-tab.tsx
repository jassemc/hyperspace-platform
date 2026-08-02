import type { AddressDto, CompanyDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatAddress(address?: AddressDto | null): string | null {
  if (!address) return null
  if (address.formattedAddress) return address.formattedAddress

  const parts = [
    address.street,
    [address.zip, address.city].filter(Boolean).join(" "),
    address.state,
    address.country,
  ].filter((part) => Boolean(part && part.trim()))

  return parts.length > 0 ? parts.join(", ") : null
}

function Field({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="grid gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-words">{value}</span>
    </div>
  )
}

export function OverviewTab({ company }: Readonly<{ company: CompanyDto }>) {
  const address = formatAddress(company.billingAddress)
  const metadataEntries = Object.entries(company.metadata ?? {})

  return (
    <div className="grid gap-4 px-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Name" value={company.name} />
          <Field label="Tax ID" value={company.taxId || "-"} />
          <Field
            label="Description"
            value={company.description || "-"}
          />
          <Field
            label="Tags"
            value={
              company.tags?.length ? (
                <span className="flex flex-wrap gap-1">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="border-0 capitalize">
                      {tag}
                    </Badge>
                  ))}
                </span>
              ) : (
                "-"
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Email" value={company.email || "-"} />
          <Field label="Phone" value={company.phone || "-"} />
          <Field
            label="Website"
            value={
              company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {company.website}
                </a>
              ) : (
                "-"
              )
            }
          />
          <Field label="Billing address" value={address || "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Company ID" value={<span className="font-mono text-xs">{company.id}</span>} />
          <Field label="Created" value={new Date(company.createdAt).toLocaleString()} />
          <Field label="Last updated" value={new Date(company.updatedAt).toLocaleString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {metadataEntries.length > 0 ? (
            metadataEntries.map(([key, value]) => (
              <Field
                key={key}
                label={key}
                value={typeof value === "string" ? value : JSON.stringify(value)}
              />
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No metadata recorded.</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
