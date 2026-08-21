"use client"

import * as React from "react"
import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"

import { SidebarLogoutButton } from "@/components/sidebar-logout-button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { getListResourceTypes } from "@/lib/service"
import type { ResourceTypeDto } from "@/lib/service/HsService"

// Import navigation configuration and types
import {
  navigationConfig,
  getDefaultActiveItem,
  applyDynamicSubMenuItems,
  type MenuItem,
  type NavigationItem,
  type SubMenuItem
} from "@/lib/navigation-config"
import { SiteLogo } from "./site-logo"
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
import { cn } from "@/lib/utils";

type AppSidebarProps = Readonly<React.ComponentProps<typeof Sidebar>>

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeItem, setActiveItem] = React.useState<MenuItem>(getDefaultActiveItem())
  const [resourceTypeItems, setResourceTypeItems] = React.useState<NavigationItem[]>([])
  const [isHovered, setIsHovered] = React.useState(false)
  const [isSticky, setIsSticky] = React.useState(false)
  const { setOpen } = useSidebar()

  // Resource types are managed data, so the menu entries are loaded from the API.
  React.useEffect(() => {
    let cancelled = false
    getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
      .then((response) => {
        if (cancelled) return
        setResourceTypeItems(
          ((response?.results ?? []) as ResourceTypeDto[]).map((type) => ({
            title: type.name,
            url: `/space/resources?resourceTypeId=${encodeURIComponent(type.id)}`,
          }))
        )
      })
      .catch((error) => {
        console.warn("Failed to load resource types for navigation", error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const navMain = React.useMemo(
    () => applyDynamicSubMenuItems(navigationConfig.navMain, "resourceTypes", resourceTypeItems),
    [resourceTypeItems]
  )

  // Re-resolve the open menu against the latest tree once dynamic items arrive.
  React.useEffect(() => {
    setActiveItem((previous) => navMain.find((item) => item.title === previous.title) ?? previous)
  }, [navMain])

  const subMenus: SubMenuItem[] = activeItem.subMenus ?? []

  // A menu url matches when its path equals the current path and every query
  // param it pins (e.g. resourceTypeId) has the same value in the current url.
  const isUrlActive = React.useCallback((url: string) => {
    if (!url || url === "#") return false
    const [urlPath, urlQuery] = url.split("?")
    if (urlPath !== pathname) return false
    if (!urlQuery) return true
    for (const [key, value] of new URLSearchParams(urlQuery)) {
      if (searchParams.get(key) !== value) return false
    }
    return true
  }, [pathname, searchParams])

  // Expose sticky state to parent components
  React.useEffect(() => {
    // Dispatch custom event to notify layout about sticky state
    const event = new CustomEvent('sidebar-sticky-change', { 
      detail: { isSticky } 
    })
    window.dispatchEvent(event)
  }, [isSticky])

  // Helper function to check if a sub-menu item is active
  const isSubMenuItemActive = React.useCallback((subItem: SubMenuItem) => {
    return isUrlActive(subItem.url) ||
      subItem.items?.some(item => isUrlActive(item.url))
  }, [isUrlActive])

  // Helper function to check if a menu item is active
  const isMenuItemActive = React.useCallback((item: MenuItem) => {
    return isUrlActive(item.url) || item.subMenus?.some(isSubMenuItemActive)
  }, [isUrlActive, isSubMenuItemActive])

  // Reset the overlay to the menu matching the current url
  const syncActiveItem = React.useCallback(() => {
    const currentActiveItem = navMain.find(isMenuItemActive)
    if (currentActiveItem) {
      setActiveItem(currentActiveItem)
    }
  }, [navMain, isMenuItemActive])

  // Only on navigation — query-param updates (paging, filters) must not close
  // a submenu the user is currently hovering.
  React.useEffect(() => {
    syncActiveItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navMain])

  const handleNavItemClick = React.useCallback((item: MenuItem) => {
    setActiveItem(item)
    setOpen(true)
  }, [setOpen])

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true)
    // Reset to active menu when leaving hover
    syncActiveItem()
  }, [syncActiveItem])

  const handleMouseLeave = React.useCallback(() => {
    if (!isSticky) {
      setIsHovered(false)
    } else {
      syncActiveItem()
    }
  }, [isSticky, syncActiveItem])

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
            <SiteLogo teams={navigationConfig.site} />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-1 md:px-0">
                <SidebarMenu>
                  {navMain.map((item) => {
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
            <SidebarLogoutButton />
          </SidebarFooter>
        </Sidebar>
      </Sidebar>

      {/* Second sidebar - Hover overlay */}
      {/*
        Pinned to the viewport, not to the page. The icon rail is `fixed h-svh`,
        but this overlay used to be absolutely positioned inside the normal
        flow — so on a long page it inherited the document height and scrolled
        away with the content. It now stays put and scrolls its own list when
        there are more submenus than fit.
      */}
      <div
        className={`fixed left-(--sidebar-width-icon) top-0 z-50 flex h-svh w-60 flex-col bg-sidebar border-r shadow-lg transition-all duration-300 ease-in-out ${
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
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
            <div className="px-2 py-2">
              <div className="space-y-1">
                {subMenus.map((item) => {
                  const isSubActive = isSubMenuItemActive(item)
                  return (
                    <Collapsible
                      // Remount when dynamic children arrive so defaultOpen re-applies.
                      key={`${item.title}-${item.items?.length ?? 0}`}
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
                                className={cn(
                                  "flex w-full flex-row h-10 gap-2 justify-start px-2",
                                  isSubActive && "bg-sidebar-primary! text-sidebar-primary-foreground!"
                                )}
                                data-active={isSubActive ? 'true' : 'false'}
                              >
                                {item.icon && <item.icon className="h-4 w-4" />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-6 py-2 space-y-1">
                                {item.items.map((subItem) => {
                                  const isSubItemActive = isUrlActive(subItem.url)
                                  return (
                                    <Button
                                      key={subItem.title}
                                      variant="ghost"
                                      asChild
                                      className={cn(
                                        "flex w-full justify-start h-8 px-2",
                                        isSubItemActive && "bg-sidebar-primary! text-sidebar-primary-foreground!"
                                      )}
                                      data-active={isSubItemActive ? 'true' : 'false'}
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
                            className={cn(
                              "flex w-full flex-row justify-start h-10 gap-2 px-2",
                              isSubActive && "bg-sidebar-primary! text-sidebar-primary-foreground!"
                            )}
                            data-active={isSubActive ? 'true' : 'false'}
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