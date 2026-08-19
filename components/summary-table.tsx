import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface AnalyticsTableProps {
    title: string
    subtitle?: string
    headers: string[]
    rows: string[][]
    /** Shown instead of the table when the request failed. */
    error?: string | null
    emptyMessage: string
}

/**
 * Plain tabular presentation for the analytics endpoints. Deliberately not a
 * chart: the shapes the API returns are small series and breakdowns that read
 * fine as tables, and this avoids pulling in a charting dependency.
 */
export function SummaryTable({
    title,
    subtitle,
    headers,
    rows,
    error,
    emptyMessage,
}: Readonly<AnalyticsTableProps>) {
    return (
        <section className="px-4">
            <div className="mb-3">
                <h2 className="text-xl font-semibold">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            {error ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            ) : (
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map((header) => (
                                    <TableHead key={header}>{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={headers.length} className="text-muted-foreground">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.join("|")}>
                                        {row.map((cell, index) => (
                                            <TableCell key={`${headers[index]}-${cell}`}>{cell}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </section>
    )
}
