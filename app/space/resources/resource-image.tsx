"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { deleteResourceImageAction, uploadResourceImageAction } from "./actions"

interface ResourceImageProps {
  resourceId: string
  imageUrl?: string | null
}

/**
 * The catalog photo is stored by its own endpoint, not with the resource body —
 * so it uploads immediately rather than waiting for the form to be submitted.
 * That also means it is only offered once the resource exists.
 */
export function ResourceImage({ resourceId, imageUrl }: Readonly<ResourceImageProps>) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<"upload" | "delete" | null>(null)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    setPending("upload")
    try {
      const formData = new FormData()
      formData.set("id", resourceId)
      formData.set("file", file)

      const result = await uploadResourceImageAction({}, formData)
      if (result.success) {
        toast.success("Image updated")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to upload the image")
      }
    } finally {
      setPending(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const onRemove = async () => {
    setPending("delete")
    try {
      const formData = new FormData()
      formData.set("id", resourceId)

      const result = await deleteResourceImageAction({}, formData)
      if (result.success) {
        toast.success("Image removed")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to remove the image")
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="grid gap-2">
      <Label>Catalog photo</Label>

      {imageUrl ? (
        <div className="relative h-36 w-full overflow-hidden rounded-md border">
          {/* Served from the public bucket, so the host is not known at build time. */}
          <Image
            src={imageUrl}
            alt="Resource photo"
            fill
            unoptimized
            className="object-cover"
            sizes="360px"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No photo yet
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {pending === "upload" ? "Uploading..." : imageUrl ? "Replace" : "Upload"}
        </Button>

        {imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={pending !== null}
            onClick={onRemove}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {pending === "delete" ? "Removing..." : "Remove"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        jpg or png. Uploading replaces the current photo immediately.
      </p>
    </div>
  )
}
