"use client"

import { useEffect, useState } from "react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeftRight } from "lucide-react"
import type { CompanyDto } from "@/lib/service/HsService"
import { listCompanyOptions, reassignMemberAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

interface ReassignMemberButtonProps {
  memberId: string
  memberName: string
  currentCompanyId: string
}

export function ReassignMemberButton({
  memberId,
  memberName,
  currentCompanyId,
}: Readonly<ReassignMemberButtonProps>) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [companies, setCompanies] = useState<CompanyDto[]>([])
  const [targetCompanyId, setTargetCompanyId] = useState("")
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    listCompanyOptions().then((results) => {
      if (!cancelled) {
        setCompanies(results.filter((company) => company.id !== currentCompanyId))
      }
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, currentCompanyId])

  const onConfirm = async () => {
    if (!targetCompanyId) {
      toast.error("Select a company")
      return
    }

    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append("memberId", memberId)
      formData.append("targetCompanyId", targetCompanyId)
      formData.append("currentCompanyId", currentCompanyId)
      const result = await reassignMemberAction({}, formData)

      if (result.success) {
        toast.success("Member reassigned")
        setIsOpen(false)
        setTargetCompanyId("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to reassign member")
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950 dark:border-amber-800"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign {memberName}</AlertDialogTitle>
          <AlertDialogDescription>
            Move this member to another company. The API requires every member to keep an employer,
            so a target company is mandatory.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={`target-company-${memberId}`}>Company</Label>
          <select
            id={`target-company-${memberId}`}
            className={selectClassName}
            value={targetCompanyId}
            onChange={(event) => setTargetCompanyId(event.target.value)}
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isPending || !targetCompanyId}>
            {isPending ? "Reassigning..." : "Reassign"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
