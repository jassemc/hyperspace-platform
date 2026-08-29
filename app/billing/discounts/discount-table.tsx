"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable, type TableFilter } from "@/components/data-table"
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

const STATUS_TAB_OPTIONS = [
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

  const columns = createColumns({ onEdit: handleEdit, onArchive: setArchivingDiscount, planNames, rateNames })

  // Kind is a fixed vocabulary, so its options come straight from the label map.
  const filters: TableFilter[] = [
    {
      key: "kind",
      label: "Kind",
      value: activeKind,
      options: (Object.entries(DISCOUNT_KIND_LABELS) as [DiscountKind, string][]).map(
        ([value, label]) => ({ value, label })
      ),
    },
  ]

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeKind ?? "all"}-${activeStatus ?? "all"}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={filters}
        inlineFilters
        showStatusTabs
        statusTabOptions={STATUS_TAB_OPTIONS}
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
