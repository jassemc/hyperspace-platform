"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  portalled = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /**
   * false renders the content in place instead of portalling to body.
   * Needed inside a vaul drawer: its modal mode makes the body
   * pointer-inert, so a body-portalled calendar renders but swallows
   * every click. Radix positions fine without the portal.
   */
  portalled?: boolean
}) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-background text-foreground z-50 w-auto rounded-md border p-3 shadow-md outline-none",
        className
      )}
      {...props}
    />
  )
  return portalled ? (
    <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
  ) : (
    content
  )
}

export { Popover, PopoverTrigger, PopoverContent }
