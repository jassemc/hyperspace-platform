"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarX, MoveRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import type { ResourceDto } from "@/lib/service/HsService"
import { endAssignmentAction, relocateAssignmentAction } from "./actions"

interface AssignmentActionButtonsProps {
  assignmentId: string
  resourceName: string
  resources: ResourceDto[]
  /** Fired after a successful end or relocate so an inline list can refetch. */
  onChanged?: () => void
}

export function AssignmentActionButtons({
  assignmentId,
  resourceName,
  resources,
  onChanged,
}: Readonly<AssignmentActionButtonsProps>) {
  const router = useRouter()
  const [pending, setPending] = useState<"end" | "relocate" | null>(null)
  const [endsAt, setEndsAt] = useState("")
  const [targetResourceId, setTargetResourceId] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")

  const submitEnd = async () => {
    setPending("end")
    try {
      const formData = new FormData()
      formData.set("id", assignmentId)
      formData.set("endsAt", endsAt)
      const result = await endAssignmentAction({}, formData)
      if (result.success) {
        toast.success("Assignment ended")
        onChanged?.()
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to end assignment")
      }
    } finally {
      setPending(null)
    }
  }

  const submitRelocate = async () => {
    setPending("relocate")
    try {
      const formData = new FormData()
      formData.set("id", assignmentId)
      formData.set("resourceId", targetResourceId)
      formData.set("effectiveDate", effectiveDate)
      const result = await relocateAssignmentAction({}, formData)
      if (result.success) {
        toast.success("Assignment relocated")
        onChanged?.()
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to relocate assignment")
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" title="Relocate to another resource">
            <MoveRight className="h-4 w-4" />
            <span className="sr-only">Relocate</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relocate assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Closes the assignment on {resourceName} and opens one on the destination from the
              effective date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor={`target-${assignmentId}`}>Destination resource</Label>
              <select
                id={`target-${assignmentId}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetResourceId}
                onChange={(e) => setTargetResourceId(e.target.value)}
              >
                <option value="">Select resource</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`effective-${assignmentId}`}>Effective date</Label>
              <Input
                id={`effective-${assignmentId}`}
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Cancel</AlertDialogCancel>
            <Button
              disabled={pending !== null || !targetResourceId || !effectiveDate}
              onClick={submitRelocate}
            >
              {pending === "relocate" ? "Relocating..." : "Relocate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            title="End assignment"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
          >
            <CalendarX className="h-4 w-4" />
            <span className="sr-only">End</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              The end date is exclusive — the last active day is the day before it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor={`ends-${assignmentId}`}>End date</Label>
            <Input
              id={`ends-${assignmentId}`}
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Keep it</AlertDialogCancel>
            <Button variant="destructive" disabled={pending !== null || !endsAt} onClick={submitEnd}>
              {pending === "end" ? "Ending..." : "End assignment"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
