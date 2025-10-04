"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Import navigation configuration and types
import {
  navigationConfig,
  getDefaultActiveItem,
  type MenuItem,
  type SubMenuItem
} from "@/lib/navigation-config"
import { TeamSwitcher } from "./team-switcher"
import {
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/sidebar";

// User type
type User = {
  name: string;
  email: string;
  id: string;
} | null;

interface AppSidebarProps extends Readonly<React.ComponentProps<typeof Sidebar>> {
  user: User;
}

export function AppSidebar({ user, ...props }: Readonly<AppSidebarProps>) {
  const [activeItem, setActiveItem] = React.useState<MenuItem>(getDefaultActiveItem())
  const [subMenus, setSubMenus] = React.useState<SubMenuItem[]>(
    getDefaultActiveItem().subMenus || []
  )
  const [isHovered, setIsHovered] = React.useState(false)
  const { setOpen } = useSidebar()

  const handleNavItemClick = React.useCallback((item: MenuItem) => {
    setActiveItem(item)
    setSubMenus(item.subMenus || [])
    setOpen(true)
  }, [setOpen])

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Main navigation"
    >
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
        {...props}
      >
        {/* First sidebar - Main navigation */}
        <Sidebar
          collapsible="none"
          className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
        >
          <SidebarHeader>
            <TeamSwitcher teams={navigationConfig.site} />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-1 md:px-0">
                <SidebarMenu>
                  {navigationConfig.navMain.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onMouseOver={() => handleNavItemClick(item)}
                        isActive={activeItem?.title === item.title}
                        className="px-2.5 md:px-2"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>
      </Sidebar>

      {/* Second sidebar - Hover overlay */}
      <div 
        className={`absolute left-full top-0 z-50 h-full w-80 bg-sidebar border-r shadow-lg transition-all duration-300 ease-in-out ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {subMenus.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.items ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex-row h-10 group-data-[collapsible=icon]:h-10! gap-2">
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton asChild className="flex-row justify-start h-10 group-data-[collapsible=icon]:h-10! gap-2">
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </div>
  )
}