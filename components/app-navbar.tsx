"use client"

import {
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { LogoutButton } from "./logout-button"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/sidebar"

// Function to generate avatar URL using DiceBear API
function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c4b5fd,a78bfa,fb7185,fdba74&radius=50`
}

// Function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AppNavbar({
  user,
}: {
  user: {
    name: string
    email: string
    id: string
  } | null;
}) {
  // Generate avatar URL based on user email for consistency
  const avatarUrl = useMemo(() => {
    if (!user) return undefined
    return generateAvatarUrl(user.email)
  }, [user])

  // Generate initials for fallback
  const initials = useMemo(() => {
    if (!user) return "U"
    return getInitials(user.name)
  }, [user])

  if (!user) return null

  return (
    <div className="flex w-full items-center gap-2 px-4">
      {/* #90 (X-03): below the md breakpoint the sidebar is hidden and
          nothing replaced it — at 375 px the Overview rendered with no
          way to leave it. The sidebar component already has an
          off-canvas (Sheet) variant driven by `openMobile`; what was
          missing was anything to open it. Desktop keeps its own
          pin/collapse control, so this shows only on small screens. */}
      <SidebarTrigger className="md:hidden" aria-label="Open navigation" />
      <div className="flex flex-1 items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          {/* #74 (S-10): "Upgrade to Pro", Account, Billing and
              Notifications were DropdownMenuItems with no onSelect, no
              href and no asChild — four more things that look clickable
              and do nothing. Logout is what this menu is actually for. */}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut />
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  )
}

