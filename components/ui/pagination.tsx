import * as React from "react"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto w-full", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center justify-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cn("", className)} {...props} />
}

function PaginationLink({ className, isActive, ...props }: React.ComponentProps<"button"> & { isActive?: boolean }) {
  return (
    <button
      data-slot="pagination-link"
      className={cn(
        "text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        isActive && "border-ring bg-accent/60",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <PaginationLink
      data-slot="pagination-previous"
      className={className}
      {...props}
    />
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <PaginationLink
      data-slot="pagination-next"
      className={className}
      {...props}
    />
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn("text-muted-foreground inline-flex h-9 items-center px-2 text-sm", className)}
      {...props}
    >
      …
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}


