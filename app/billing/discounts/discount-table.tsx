"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { DiscountDto, DiscountKind, DiscountStatus } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddDiscountForm } from "./add-discount-form"
import { archiveDiscountAction } from "./actions"
import { DISCOUNT_KIND_LABELS } from "./discount-meta"

interface DiscountTableProps {
  data: DiscountDto[]
  totalCount?: number
  planNames?: Record<string, string>
  rateNames?: Record<string, string>
  activeKind?: DiscountKind
  activeStatus?: DiscountStatus
}

const KIND_OPTIONS: { value?: DiscountKind; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "plan", label: DISCOUNT_KIND_LABELS.plan },
  { value: "resource_rate", label: DISCOUNT_KIND_LABELS.resource_rate },
  { value: "promo", label: DISCOUNT_KIND_LABELS.promo },
]

const STATUS_OPTIONS: { value?: DiscountStatus; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
]

export function DiscountTable({
  data,
  totalCount,
  planNames = {},
  rateNames = {},
  activeKind,
  activeStatus,
}: Readonly<DiscountTableProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountDto | null>(null)
  const [archivingDiscount, setArchivingDiscount] = useState<DiscountDto | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleEdit = (discount: DiscountDto) => {
    setEditingDiscount(discount)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingDiscount(null)
  }

  const handleArchive = async () => {
    if (!archivingDiscount) return
    setIsArchiving(true)
    try {
      const formData = new FormData()
      formData.set("id", archivingDiscount.id)
      const result = await archiveDiscountAction({}, formData)
      if (result.success) {
        toast.success("Discount archived")
        setArchivingDiscount(null)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to archive discount")
      }
    } finally {
      setIsArchiving(false)
    }
  }

  const applyFilter = (key: "kind" | "status", value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // a narrower list starts at the first page
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }

  const columns = createColumns({ onEdit: handleEdit, onArchive: setArchivingDiscount, planNames, rateNames })

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Kind</span>
          <div className="flex flex-wrap gap-1">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => applyFilter("kind", option.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  activeKind === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => applyFilter("status", option.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  activeStatus === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeKind ?? "all"}-${activeStatus ?? "all"}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />

      <AddDiscountForm
        key={editingDiscount?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingDiscount={editingDiscount}
      />

      <AlertDialog open={Boolean(archivingDiscount)} onOpenChange={(open) => !open && setArchivingDiscount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archivingDiscount?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing memberships and charges keep it; it can no longer be assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={isArchiving} onClick={handleArchive}>
              {isArchiving ? "Archiving..." : "Archive"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
