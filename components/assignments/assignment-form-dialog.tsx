"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getListMemberships, getListResources } from "@/lib/service"
import type { MembershipDto, ResourceDto } from "@/lib/service/HsService"
import { createAssignmentAction } from "./actions"

const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

/**
 * One side of the assignment is fixed by where the dialog was opened from —
 * a membership picks a resource, a resource picks a membership — so only
 * the other side is fetched and offered.
 */
export type AssignmentAnchor =
  | { kind: "membership"; membership: MembershipDto }
  | { kind: "resource"; resource: ResourceDto }

interface AssignmentFormDialogProps {
  anchor: AssignmentAnchor
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fired after a successful create so an inline list can refetch. */
  onCreated?: () => void
}

export function AssignmentFormDialog({ anchor, open, onOpenChange, onCreated }: Readonly<AssignmentFormDialogProps>) {
  const router = useRouter()
  const [resources, setResources] = useState<ResourceDto[]>([])
  const [memberships, setMemberships] = useState<MembershipDto[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    const load =
      anchor.kind === "membership"
        ? getListResources({ limit: 100, offset: 0, sort: "ASC" }).then((page) => {
            if (!cancelled) setResources((page.results ?? []) as ResourceDto[])
          })
        : getListMemberships({ limit: 100, offset: 0, sort: "ASC", status: "active" }).then((page) => {
            if (!cancelled) setMemberships((page.results ?? []) as MembershipDto[])
          })
    load
      .catch(() => {
        if (!cancelled) toast.error("Could not load the options")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, anchor.kind])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const formData = new FormData(event.currentTarget)
      if (anchor.kind === "membership") formData.set("membershipId", anchor.membership.id)
      else formData.set("resourceId", anchor.resource.id)
      const result = await createAssignmentAction({}, formData)
      if (result.success) {
        toast.success("Assignment created")
        onCreated?.()
        router.refresh()
        onOpenChange(false)
      } else {
        setError(result.error ?? "Failed to create assignment")
      }
    } finally {
      setPending(false)
    }
  }

  const anchorLabel =
    anchor.kind === "membership" ? anchor.membership.name || "this membership" : anchor.resource.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{anchor.kind === "membership" ? "Assign a resource" : "Assign a membership"}</DialogTitle>
          <DialogDescription>
            {anchor.kind === "membership"
              ? `Allocate a resource to ${anchorLabel} for a period.`
              : `Allocate ${anchorLabel} to a membership for a period.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          {anchor.kind === "membership" ? (
            <div className="grid gap-2">
              <Label htmlFor="assign-resourceId">Resource</Label>
              <select id="assign-resourceId" name="resourceId" className={selectClassName} required disabled={loading}>
                <option value="">{loading ? "Loading..." : "Select resource"}</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="assign-membershipId">Membership</Label>
              <select id="assign-membershipId" name="membershipId" className={selectClassName} required disabled={loading}>
                <option value="">{loading ? "Loading..." : "Select membership"}</option>
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.id}>
                    {membership.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Only active memberships are listed.</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="assign-startsAt">Starts at</Label>
            <Input id="assign-startsAt" name="startsAt" type="date" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign-endsAt">Ends at</Label>
            <Input id="assign-endsAt" name="endsAt" type="date" />
            <p className="text-xs text-muted-foreground">Optional planned end. Leave blank for open-ended.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign-notes">Notes</Label>
            <textarea
              id="assign-notes"
              name="notes"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || loading}>
              {pending ? "Creating..." : "Create assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
