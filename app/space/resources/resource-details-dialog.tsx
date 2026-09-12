"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CopyId, Section, Term, Terms } from "@/components/details-dialog-parts"
import { Archive, ArchiveRestore, Armchair, Pencil } from "lucide-react"
import type { ResourceDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { AssignmentsSection } from "@/components/assignments/assignments-section"
import { ArchiveResourceAlert } from "./archive-resource-alert"
import { useResourceArchive } from "./resource-row-actions"
import { RESOURCE_STATUS_CLASSES, RESOURCE_STATUS_LABELS } from "./resource-status"

function minutes(value: number | null | undefined): string {
  if (!value) return "—"
  return value % 60 === 0 ? `${value / 60} h` : `${value} min`
}

/** Everything a resource is made of, read-only, plus who it is assigned to. */
export function ResourceDetailsDialog({
  resource,
  open,
  onOpenChange,
  onEdit,
  resourceTypeName,
}: Readonly<{
  resource: ResourceDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  resourceTypeName?: string
}>) {
  const { pending, archive, restore } = useResourceArchive(resource)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const typeLabel = (resourceTypeName ?? resource.resourceType?.name ?? "Resource").replaceAll("_", " ")
  const amenities = resource.amenities ?? []
  const rates = resource.rates ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6 text-left">
            {resource.imageUrl && (
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border">
                <Image src={resource.imageUrl} alt="" fill unoptimized className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="leading-tight">{resource.name}</DialogTitle>
                <Badge variant="secondary" className={`${RESOURCE_STATUS_CLASSES[resource.status] ?? ""} border-0`}>
                  {RESOURCE_STATUS_LABELS[resource.status] ?? resource.status}
                </Badge>
                {!resource.active && <Badge variant="outline">Archived</Badge>}
                {resource.hidden && <Badge variant="outline">Hidden</Badge>}
              </div>
              <DialogDescription className="capitalize">{typeLabel}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}

          <AssignmentsSection
            anchor={{ kind: "resource", resource }}
            open={open}
            assignBlocker={resource.active ? null : "Archived resources cannot be assigned"}
            createOpen={assignOpen}
            onCreateOpenChange={setAssignOpen}
          />

          <Section title="Booking">
            <Terms>
              <Term label="Capacity" value={resource.capacity ?? "—"} />
              <Term label="Minimum duration" value={minutes(resource.minDurationMin)} />
              <Term label="Maximum duration" value={minutes(resource.maxDurationMin)} />
              <Term label="Cancellation notice" value={resource.cancellationHours ? `${resource.cancellationHours} h` : "None"} />
              <Term
                label="Sold under"
                value={
                  resource.targetPlanIds?.length
                    ? `${resource.targetPlanIds.length} ${resource.targetPlanIds.length === 1 ? "plan" : "plans"}`
                    : "—"
                }
              />
            </Terms>
          </Section>

          <Section title="Rates">
            {rates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rates on this resource.</p>
            ) : (
              <Terms>
                {rates.map((rate) => (
                  <Term
                    key={rate.id}
                    label={rate.name}
                    value={`${formatEnumLabel(rate.intervalType)}${rate.isWeekendRate ? " · weekend" : ""}`}
                  />
                ))}
              </Terms>
            )}
          </Section>

          <Section title="Amenities">
            {amenities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No amenities listed.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {amenities.map((amenity) => (
                  <Badge key={amenity.id} variant="outline" className="font-normal">
                    {amenity.name}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDate(resource.createdAt)}</span>
            <CopyId id={resource.id} label="Resource" />
          </p>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!resource.active}
            title={resource.active ? "Allocate this resource to a membership" : "Archived resources cannot be assigned"}
            onClick={() => setAssignOpen(true)}
          >
            <Armchair className="mr-1.5 h-4 w-4" />
            Assign
          </Button>
          {resource.active ? (
            <Button variant="destructive" size="sm" disabled={pending} onClick={() => setArchiveOpen(true)}>
              <Archive className="mr-1.5 h-4 w-4" />
              Archive
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => void restore()}>
              <ArchiveRestore className="mr-1.5 h-4 w-4" />
              {pending ? "Restoring..." : "Restore"}
            </Button>
          )}
        </DialogFooter>

        <ArchiveResourceAlert
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          resourceName={resource.name}
          pending={pending}
          onConfirm={async () => {
            if (await archive()) setArchiveOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
