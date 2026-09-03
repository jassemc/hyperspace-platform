import Link from "next/link"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

/** A titled block of the overview with a link into its tab. */
export function Section({
  title,
  viewAllHref,
  aside,
  children,
}: Readonly<{
  title: string
  viewAllHref?: string
  /** Sits beside the title — a status chip, a count. */
  aside?: ReactNode
  children: ReactNode
}>) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {aside}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  )
}

export function Rows({ children }: Readonly<{ children: ReactNode }>) {
  return <ul className="divide-y rounded-md border">{children}</ul>
}

export function Row({
  icon,
  primary,
  secondary,
  aside,
}: Readonly<{
  icon?: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  aside?: ReactNode
}>) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate">{primary}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </li>
  )
}

export function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
