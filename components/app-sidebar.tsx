"use client"

import * as React from "react"
import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

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
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/sidebar";
import { cn } from "@/lib/utils"

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
  const pathname = usePathname()
  const [activeItem, setActiveItem] = React.useState<MenuItem>(getDefaultActiveItem())
  const [subMenus, setSubMenus] = React.useState<SubMenuItem[]>(
    getDefaultActiveItem().subMenus || []
  )
  const [isHovered, setIsHovered] = React.useState(false)
  const [isSticky, setIsSticky] = React.useState(false)
  const { setOpen } = useSidebar()

  // Expose sticky state to parent components
  React.useEffect(() => {
    // Dispatch custom event to notify layout about sticky state
    const event = new CustomEvent('sidebar-sticky-change', { 
      detail: { isSticky } 
    })
    window.dispatchEvent(event)
  }, [isSticky])

  // Update active item based on current pathname
  React.useEffect(() => {
    const currentActiveItem = navigationConfig.navMain.find(item =>
      item.url === pathname ||
      item.subMenus?.some(sub =>
        sub.url === pathname ||
        sub.items?.some(subItem => subItem.url === pathname)
      )
    )
    
    if (currentActiveItem) {
      setActiveItem(currentActiveItem)
      setSubMenus(currentActiveItem.subMenus || [])
    }
  }, [pathname])

  const handleNavItemClick = React.useCallback((item: MenuItem) => {
    setActiveItem(item)
    setSubMenus(item.subMenus || [])
    setOpen(true)
  }, [setOpen])

  // Helper function to check if a menu item is active
  const isMenuItemActive = React.useCallback((item: MenuItem) => {
    return item.url === pathname ||
      item.subMenus?.some(sub =>
        sub.url === pathname ||
        sub.items?.some(subItem => subItem.url === pathname)
      )
  }, [pathname])

  // Helper function to check if a sub-menu item is active
  const isSubMenuItemActive = React.useCallback((subItem: SubMenuItem) => {
    return subItem.url === pathname ||
      subItem.items?.some(item => item.url === pathname)
  }, [pathname])

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    if (!isSticky) {
      setIsHovered(false)
    }
  }, [isSticky])

  const handleToggleSticky = React.useCallback(() => {
    setIsSticky(prev => !prev)
    if (isSticky) {
      setIsHovered(false)
    } else {
      setIsHovered(true)
    }
  }, [isSticky])

  return (
    <nav 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
                  {navigationConfig.navMain.map((item) => {
                    const isActive = isMenuItemActive(item)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onMouseOver={() => handleNavItemClick(item)}
                          data-active={isActive ? 'true' : 'false'} // ✅ this is key
                          className={cn(
                            'px-2.5 md:px-2',
                            isActive && 'bg-sidebar-primary! text-sidebar-primary-foreground!'
                          )}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
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
          isHovered || isSticky ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
        <div className="flex h-full w-full flex-col">
          <div className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-medium">
                {activeItem?.title}
              </div>
              <Button
                variant={isSticky ? "secondary" : "ghost"}
                size="icon"
                onClick={handleToggleSticky}
                className="ml-auto h-8 w-8"
                title={isSticky ? "Unpin sidebar" : "Pin sidebar"}
              >
                {isSticky ? (
                  <ChevronsLeft className="h-4 w-4" />
                ) : (
                  <ChevronsRight className="h-4 w-4" />
                )}
                <span className="sr-only">{isSticky ? "Unpin sidebar" : "Pin sidebar"}</span>
              </Button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            <div className="px-2 py-2">
              <div className="space-y-1">
                {subMenus.map((item) => {
                  const isSubActive = isSubMenuItemActive(item)
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={isSubActive}
                      className="group/collapsible"
                    >
                      <div>
                        {item.items ? (
                          <>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className={`flex w-full flex-row h-10 gap-2 justify-start px-2 ${
                                  isSubActive 
                                    ? 'sidebar-active' 
                                    : 'sidebar-hover'
                                }`}
                              >
                                {item.icon && <item.icon className="h-4 w-4" />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-6 space-y-1">
                                {item.items.map((subItem) => {
                                  const isSubItemActive = subItem.url === pathname
                                  return (
                                    <Button
                                      key={subItem.title}
                                      variant="ghost"
                                      asChild
                                      className={`flex w-full justify-start h-8 px-2 ${
                                        isSubItemActive 
                                          ? 'sidebar-active' 
                                          : 'sidebar-hover'
                                      }`}
                                    >
                                      <a href={subItem.url}>
                                        <span className="text-sm">{subItem.title}</span>
                                      </a>
                                    </Button>
                                  )
                                })}
                              </div>
                            </CollapsibleContent>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            asChild
                            className={`flex w-full flex-row justify-start h-10 gap-2 px-2 ${
                              isSubActive 
                                ? 'sidebar-active' 
                                : 'sidebar-hover'
                            }`}
                          >
                            <a href={item.url}>
                              {item.icon && <item.icon className="h-4 w-4" />}
                              <span>{item.title}</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}