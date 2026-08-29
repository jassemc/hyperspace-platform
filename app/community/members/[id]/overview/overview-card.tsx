import Link from "next/link"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

/**
 * One domain at a glance: a headline figure, the few rows that matter, a
 * link to the full tab and the one action staff reach for most.
 */
export function OverviewCard({
  title,
  viewAllHref,
  action,
  headline,
  subline,
  children,
}: Readonly<{
  title: string
  viewAllHref: string
  /** The quick action(s) this card offers. */
  action: ReactNode
  /** Big number or short status line. */
  headline: ReactNode
  /** Muted context under the headline. */
  subline?: ReactNode
  children: ReactNode
}>) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <div className="text-2xl font-semibold tabular-nums">{headline}</div>
          {subline && <p className="text-xs text-muted-foreground">{subline}</p>}
        </div>
        <div className="flex-1 text-sm">{children}</div>
        <div className="flex flex-wrap gap-2">{action}</div>
      </CardContent>
    </Card>
  )
}

export function CardRows({ children }: Readonly<{ children: ReactNode }>) {
  return <ul className="divide-y rounded-md border">{children}</ul>
}

export function CardRow({
  primary,
  secondary,
  aside,
}: Readonly<{ primary: ReactNode; secondary?: ReactNode; aside?: ReactNode }>) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate">{primary}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
      {aside}
    </li>
  )
}

export function CardEmpty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
