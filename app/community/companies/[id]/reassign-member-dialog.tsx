"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { CompanyDto, MemberDto } from "@/lib/service/HsService"
import { listCompanyOptions, reassignMemberAction } from "./actions"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

interface ReassignMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberDto
  currentCompanyId: string
  detach: boolean
  onDone: () => void
}

/**
 * Reassign and detach are the same move under the hood — this dialog just
 * preselects "no employer" for the latter. The company list loads only once
 * the dialog opens, so a table of fifty rows doesn't fire fifty requests for
 * a menu nobody opened.
 */
export function ReassignMemberDialog({
  open,
  onOpenChange,
  member,
  currentCompanyId,
  detach,
  onDone,
}: Readonly<ReassignMemberDialogProps>) {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyDto[]>([])
  const [target, setTarget] = useState(detach ? "__none__" : "")
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    listCompanyOptions()
      .then((results) => {
        if (!cancelled) {
          setCompanies(results.filter((company) => company.id !== currentCompanyId))
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load companies")
      })

    return () => {
      cancelled = true
    }
  }, [open, currentCompanyId])

  useEffect(() => {
    setTarget(detach ? "__none__" : "")
  }, [open, detach])

  const isDetaching = target === "__none__"

  const onConfirm = async () => {
    if (!target) {
      toast.error("Select a company")
      return
    }

    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append("memberId", member.id)
      formData.append("currentCompanyId", currentCompanyId)
      if (isDetaching) {
        formData.append("detach", "on")
      } else {
        formData.append("targetCompanyId", target)
      }
      const result = await reassignMemberAction({}, formData)

      if (result.success) {
        toast.success(isDetaching ? "Member detached" : "Member reassigned")
        router.refresh()
        onDone()
      } else {
        toast.error(result.error || "Failed to reassign member")
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {detach ? `Detach ${member.fullName}?` : `Reassign ${member.fullName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Move this member to another company, or make them solo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={`target-company-${member.id}`}>Company</Label>
          <select
            id={`target-company-${member.id}`}
            className={selectClassName}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            <option value="">Select a company</option>
            <option value="__none__">No employer (solo)</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isPending || !target}>
            {isPending ? (isDetaching ? "Detaching..." : "Reassigning...") : isDetaching ? "Detach" : "Reassign"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
