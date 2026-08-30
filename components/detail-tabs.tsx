"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/table-skeleton"
import { cn } from "@/lib/utils"

/** Query keys owned by a tab's table; they mean nothing on the next tab. */
const TAB_LOCAL_PARAMS = ["page", "pageSize", "name", "status", "kind", "from", "to", "uninvoiced"]

export interface DetailTab<T extends string> {
  value: T
  label: string
}

/** Same quiet pill as the status tabs above every table (data-table.tsx). */
function TabCount({ value, active }: Readonly<{ value?: number; active: boolean }>) {
  if (typeof value !== "number") return null
  return (
    <span
      className={cn(
        "ml-2 rounded px-1.5 py-0.5 text-xs tabular-nums",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {value}
    </span>
  )
}

function OverviewSkeleton() {
  return (
    <div className="px-4">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  )
}

function TabContentSkeleton({ tab }: Readonly<{ tab: string }>) {
  if (tab === "overview") return <OverviewSkeleton />

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="grid gap-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="px-4">
        <TableSkeleton rows={5} />
      </div>
    </div>
  )
}

/**
 * The tab strip of a details page (member, company). The active tab lives
 * in the URL, so switching is a server navigation: the highlight moves
 * optimistically on click and the body shows a skeleton until the new tab's
 * payload lands, instead of the page appearing frozen. Styled like the
 * status tabs above every table, count pills included.
 */
export function DetailTabs<T extends string>({
  tabs,
  activeTab,
  counts = {},
  children,
}: Readonly<{
  tabs: readonly DetailTab<T>[]
  activeTab: T
  /** Figures shown beside the labels, from the page's payload. */
  counts?: Partial<Record<T, number>>
  children: ReactNode
}>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedTab, setSelectedTab] = useState<T>(activeTab)

  // Re-sync once the navigation resolves, and on browser back/forward.
  useEffect(() => {
    setSelectedTab(activeTab)
  }, [activeTab])

  const onValueChange = (value: string) => {
    const next = value as T
    if (next === selectedTab) return

    setSelectedTab(next)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", next)
    for (const key of TAB_LOCAL_PARAMS) params.delete(key)

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const isSwitching = isPending || selectedTab !== activeTab

  return (
    <>
      {/* Inset to match the content, like the status tabs above a table. */}
      <div className="mx-4 mb-4 border-b">
        <Tabs value={selectedTab} onValueChange={onValueChange} className="w-full">
          <TabsList variant="line" className="max-w-full overflow-x-auto border-b-0">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <TabCount value={counts[tab.value]} active={selectedTab === tab.value} />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isSwitching ? <TabContentSkeleton tab={selectedTab} /> : children}
    </>
  )
}
