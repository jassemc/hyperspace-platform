import type { MemberDetailsDto } from "@/lib/service/HsService"

export function OverviewTab({ member }: Readonly<{ member: MemberDetailsDto }>) {
  return (
    <p className="px-4 text-sm text-muted-foreground">
      {member.fullName}: the overview is built in a later task.
    </p>
  )
}
