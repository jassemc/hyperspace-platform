"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * `line` styles the triggers through the list, so a trigger stays a trigger and
 * callers do not repeat the same overrides at every call site.
 */
const tabsListVariants = cva(
  "text-muted-foreground inline-flex items-center",
  {
    variants: {
      variant: {
        default: "bg-muted h-9 w-fit justify-center rounded-lg p-[3px]",
        line: cn(
          "h-auto w-fit justify-start gap-5 rounded-none border-b bg-transparent p-0",
          "[&_[data-slot=tabs-trigger]]:h-auto [&_[data-slot=tabs-trigger]]:flex-none",
          "[&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-0",
          "[&_[data-slot=tabs-trigger]]:border-b-2 [&_[data-slot=tabs-trigger]]:border-transparent",
          "[&_[data-slot=tabs-trigger]]:bg-transparent [&_[data-slot=tabs-trigger]]:px-0",
          "[&_[data-slot=tabs-trigger]]:pt-2 [&_[data-slot=tabs-trigger]]:pb-2.5",
          "[&_[data-slot=tabs-trigger]]:text-muted-foreground",
          "[&_[data-slot=tabs-trigger][data-state=active]]:border-primary",
          "[&_[data-slot=tabs-trigger][data-state=active]]:bg-transparent",
          "[&_[data-slot=tabs-trigger][data-state=active]]:text-foreground",
          "[&_[data-slot=tabs-trigger][data-state=active]]:shadow-none"
        ),
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant ?? "default"}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
