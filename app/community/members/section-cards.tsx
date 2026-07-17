import { getListMembers } from "@/lib/service"
import type { MemberDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UsersIcon, UserPlusIcon, LinkIcon, UserCheckIcon } from "lucide-react"

type MembersPage = {
  results?: MemberDto[]
  meta?: { totalItems?: number }
}

type MemberStats = {
  total: number
  leads: number
  active: number
  withPortal: number
}

async function loadMemberStats(): Promise<MemberStats> {
  try {
    const response = (await getListMembers({
      limit: 1000,
      offset: 0,
      sort: "ASC",
    })) as MembersPage

    const members = response.results ?? []
    const total = response.meta?.totalItems ?? members.length

    return {
      total,
      leads: members.filter((member) => member.status === "lead").length,
      active: members.filter((member) => member.status === "active").length,
      withPortal: members.filter((member) => member.hasPortalAccess).length,
    }
  } catch (error) {
    console.warn("Failed to load member stats", error)
    return { total: 0, leads: 0, active: 0, withPortal: 0 }
  }
}

export async function SectionCards() {
  const stats = await loadMemberStats()

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total members</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.total}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UsersIcon className="size-3" />
              CRM
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">People in your community directory</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Leads</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.leads}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UserPlusIcon className="size-3" />
              Pipeline
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Contacts still in lead status</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Active</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.active}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UserCheckIcon className="size-3" />
              Members
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Derived active membership status</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Portal linked</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.withPortal}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <LinkIcon className="size-3" />
              Access
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Members with claimed portal access</div>
        </CardFooter>
      </Card>
    </div>
  )
}
