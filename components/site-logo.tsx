"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar
} from "@/components/sidebar"

export function SiteLogo({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType | string // Icon component or image URL
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  if (!activeTeam) {
    return null
  }

  function renderLogo(logo: React.ElementType | string) {
    if (typeof logo === "string") {
      // It's an image URL
      return (
        <Image
          src={logo}
          alt="team logo"
          width={32}
          height={32}
          className="object-contain"
        />
      )
    }
    // Otherwise, assume it's a React component (icon)
    const Icon = logo
    return <Icon className="size-4" />
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
      <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex flex-row"
            >
              <div className="text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg overflow-hidden">
                {renderLogo(activeTeam.logo)}
              </div>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
