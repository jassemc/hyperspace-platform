"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, ArchiveRestore, Armchair, Edit, Eye, Loader2, MoreHorizontal } from "lucide-react"
import type { ResourceDto } from "@/lib/service/HsService"
import { AssignmentFormDialog } from "@/components/assignments/assignment-form-dialog"
import { ArchiveResourceAlert } from "./archive-resource-alert"
import { setResourceActiveAction } from "./actions"

interface ResourceRowActionsProps {
  resource: ResourceDto
  onDetails: (resource: ResourceDto) => void
  onEdit: (resource: ResourceDto) => void
}

/** Archive stands in for delete: the API has no DELETE for resources, so `active` is flipped instead. */
export function useResourceArchive(resource: ResourceDto) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const apply = async (nextActive: boolean): Promise<boolean> => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.set("id", resource.id)
      formData.set("active", String(nextActive))
      const result = await setResourceActiveAction({}, formData)
      if (result.success) {
        toast.success(nextActive ? `${resource.name} restored` : `${resource.name} archived`)
        router.refresh()
        return true
      }
      toast.error(result.error ?? "Failed to update the resource")
      return false
    } finally {
      setPending(false)
    }
  }

  return { pending, archive: () => apply(false), restore: () => apply(true) }
}

/**
 * One "⋯" trigger per row, same shape as the memberships table. The
 * dialogs are controlled from here rather than nested in menu items, since
 * the menu unmounts its content on close.
 */
export function ResourceRowActions({ resource, onDetails, onEdit }: Readonly<ResourceRowActionsProps>) {
  const { pending, archive, restore } = useResourceArchive(resource)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            <span className="sr-only">Open actions for {resource.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onDetails(resource)}>
            <Eye />
            Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(resource)}>
            <Edit />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!resource.active}
            title={resource.active ? "Allocate this resource to a membership" : "Archived resources cannot be assigned"}
            onSelect={() => setAssignOpen(true)}
          >
            <Armchair />
            <span className="flex flex-col">
              <span>Assign membership</span>
              {!resource.active && <span className="text-xs text-muted-foreground">Archived resources cannot be assigned</span>}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {resource.active ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setArchiveOpen(true)}>
              <Archive />
              Archive
            </DropdownMenuItem>
          ) : (
            // Restoring is harmless, so it goes straight through without a dialog.
            <DropdownMenuItem onSelect={() => void restore()}>
              <ArchiveRestore />
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveResourceAlert
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        resourceName={resource.name}
        pending={pending}
        onConfirm={async () => {
          if (await archive()) setArchiveOpen(false)
        }}
      />

      {assignOpen && (
        <AssignmentFormDialog anchor={{ kind: "resource", resource }} open={assignOpen} onOpenChange={setAssignOpen} />
      )}
    </>
  )
}
