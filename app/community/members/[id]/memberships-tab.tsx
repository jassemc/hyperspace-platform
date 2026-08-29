import type { MemberDetailsDto } from "@/lib/service/HsService"
import type { SearchParamsInput } from "@/lib/search-params"

export async function MembershipsTab({
  member,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  return (
    <p className="px-4 text-sm text-muted-foreground">
      {member.fullName}: this tab is built in a later task.
    </p>
  )
}
