"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Section } from "@/components/details-dialog-parts"
import { Plus } from "lucide-react"
import { getListAssignments, getListMemberships, getListResources } from "@/lib/service"
import type { AssignmentDto, MembershipDto, ResourceDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { AssignmentActionButtons } from "./assignment-actions-buttons"
import { AssignmentFormDialog, type AssignmentAnchor } from "./assignment-form-dialog"

/** Open-ended, or ended once the exclusive end date has passed. */
export function isAssignmentActive(assignment: AssignmentDto): boolean {
  if (!assignment.endsAt) return true
  return new Date(assignment.endsAt).getTime() > Date.now()
}

interface AssignmentsSectionProps {
  anchor: AssignmentAnchor
  /** The owning dialog is open; the list fetches only then. */
  open: boolean
  /** Hides the "Assign" button with this reason, e.g. a membership that is not active. */
  assignBlocker?: string | null
  /** Lets a parent (the details footer) open the create dialog. */
  createOpen?: boolean
  onCreateOpenChange?: (open: boolean) => void
}

/**
 * The assignments of one membership or one resource, with relocate / end on
 * each active row and a create button. Fetched per open like the pauses
 * list — a table must not fire a request per row for dialogs nobody opened.
 */
export function AssignmentsSection({
  anchor,
  open,
  assignBlocker = null,
  createOpen,
  onCreateOpenChange,
}: Readonly<AssignmentsSectionProps>) {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null)
  const [resources, setResources] = useState<ResourceDto[]>([])
  const [membershipNames, setMembershipNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [localCreateOpen, setLocalCreateOpen] = useState(false)
  const [version, setVersion] = useState(0)

  const isControlled = createOpen !== undefined
  const formOpen = isControlled ? createOpen : localCreateOpen
  const setFormOpen = isControlled ? (onCreateOpenChange ?? (() => undefined)) : setLocalCreateOpen
  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  const anchorId = anchor.kind === "membership" ? anchor.membership.id : anchor.resource.id

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)

    const filter = anchor.kind === "membership" ? { membershipId: anchorId } : { resourceId: anchorId }
    // Resources are needed either way: for the resource name on each row and
    // as relocate destinations. Membership names only matter on a resource.
    Promise.all([
      getListAssignments({ limit: 100, offset: 0, sort: "DESC", ...filter }),
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      anchor.kind === "resource" ? getListMemberships({ limit: 100, offset: 0, sort: "ASC" }) : Promise.resolve(null),
    ])
      .then(([assignmentPage, resourcePage, membershipPage]) => {
        if (cancelled) return
        setAssignments((assignmentPage.results ?? []) as AssignmentDto[])
        setResources((resourcePage.results ?? []) as ResourceDto[])
        if (membershipPage) {
          const names: Record<string, string> = {}
          for (const membership of (membershipPage.results ?? []) as MembershipDto[]) {
            names[membership.id] = membership.name
          }
          setMembershipNames(names)
        }
      })
      .catch(() => {
        if (!cancelled) setAssignments([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, anchor.kind, anchorId, version])

  const resourceNames: Record<string, string> = {}
  for (const resource of resources) resourceNames[resource.id] = resource.name

  const counterpart = (assignment: AssignmentDto) =>
    anchor.kind === "membership"
      ? resourceNames[assignment.resourceId] ?? "Unknown resource"
      : membershipNames[assignment.membershipId] ?? "Unknown membership"

  return (
    <>
      <Section
        title="Assignments"
        aside={
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            disabled={Boolean(assignBlocker)}
            title={assignBlocker ?? undefined}
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {anchor.kind === "membership" ? "Assign resource" : "Assign membership"}
          </Button>
        }
      >
        {loading || assignments === null ? (
          <Skeleton className="h-10 w-full" />
        ) : assignments.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {anchor.kind === "membership"
              ? "No resource is assigned to this membership."
              : "No membership is assigned to this resource."}
          </p>
        ) : (
          <div className="rounded-lg border text-sm">
            {assignments.map((assignment) => {
              const active = isAssignmentActive(assignment)
              return (
                <div
                  key={assignment.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {anchor.kind === "resource" ? (
                        <Link href={`/community/memberships?q=${encodeURIComponent(counterpart(assignment))}`} className="text-primary hover:underline">
                          {counterpart(assignment)}
                        </Link>
                      ) : (
                        <span>{counterpart(assignment)}</span>
                      )}
                      <Badge
                        variant="secondary"
                        className={
                          active
                            ? "border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "border-0 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {active ? "Active" : "Ended"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(assignment.startsAt)} →{" "}
                      {assignment.endsAt ? formatDate(assignment.endsAt) : "open-ended"}
                    </p>
                    {assignment.notes && <p className="text-xs text-muted-foreground">{assignment.notes}</p>}
                  </div>
                  {active && (
                    <div className="flex items-center gap-2">
                      <AssignmentActionButtons
                        assignmentId={assignment.id}
                        resourceName={resourceNames[assignment.resourceId] ?? "this resource"}
                        resources={resources.filter((resource) => resource.id !== assignment.resourceId)}
                        onChanged={refetch}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {formOpen && (
        <AssignmentFormDialog anchor={anchor} open={formOpen} onOpenChange={setFormOpen} onCreated={refetch} />
      )}
    </>
  )
}
