"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ResourceTypeDto } from "@/lib/service/HsService"

/**
 * Scopes the grid to one kind of room. "All" is the default, so it is
 * absent from the URL rather than written as a value.
 */
export function ResourceTypeTabs({
  types,
  activeTypeId,
}: Readonly<{ types: ResourceTypeDto[]; activeTypeId?: string }>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (types.length === 0) return null

  return (
    <div className="mx-4 mb-3 border-b">
      <Tabs
        value={activeTypeId ?? "all"}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString())
          if (value === "all") {
            params.delete("resourceTypeId")
          } else {
            params.set("resourceTypeId", value)
          }
          startTransition(() => router.replace(`?${params.toString()}`))
        }}
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto border-b-0">
          <TabsTrigger value="all" disabled={isPending}>
            All rooms
          </TabsTrigger>
          {types.map((type) => (
            <TabsTrigger key={type.id} value={type.id} disabled={isPending}>
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
