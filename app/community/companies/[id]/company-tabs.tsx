"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, useSearchParams } from "next/navigation"
import { TableSkeleton } from "../table-skeleton"

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "members", label: "Members" },
  { value: "plans", label: "Plans" },
]

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 px-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full rounded-xl" />
      ))}
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
 * The active tab lives in the URL, so switching is a server navigation. The
 * highlight moves optimistically on click and the body shows a skeleton until
 * the new tab's payload lands, instead of the page appearing frozen.
 */
export function CompanyTabs({
  activeTab,
  children,
}: Readonly<{ activeTab: string; children: ReactNode }>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedTab, setSelectedTab] = useState(activeTab)

  // Re-sync once the navigation resolves, and on browser back/forward.
  useEffect(() => {
    setSelectedTab(activeTab)
  }, [activeTab])

  const onValueChange = (value: string) => {
    if (value === selectedTab) return

    setSelectedTab(value)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    // Table state belongs to the tab that was left behind.
    params.delete("page")
    params.delete("pageSize")
    params.delete("name")

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const isSwitching = isPending || selectedTab !== activeTab

  return (
    <>
      <div className="px-4 pb-4">
        <Tabs value={selectedTab} onValueChange={onValueChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isSwitching ? <TabContentSkeleton tab={selectedTab} /> : children}
    </>
  )
}
