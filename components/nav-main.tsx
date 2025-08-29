"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    onClick?: () => void
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: Icon
      onClick?: () => void
      isActive?: boolean
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* <SidebarMenuButton
              tooltip="Add dataset"
              className="bg-sibvi-cyan-200 text-sibvi-cyan-900 hover:bg-sibvi-cyan-300 active:bg-sibvi-cyan-400 min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Add dataset</span>
            </SidebarMenuButton> */}
            {/* <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button> */}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title}
                onClick={item.onClick}
                className={item.isActive ? "bg-sibvi-cyan-700 text-sibvi-cyan-50 hover:bg-sibvi-cyan-700 hover:text-sibvi-cyan-50" : "text-sibvi-cyan-50 hover:bg-sibvi-cyan-700 hover:text-sibvi-cyan-50 active:bg-sibvi-cyan-700 active:text-sibvi-cyan-50"}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {item.items && item.items.length > 0 && (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-sibvi-cyan-700"></div>
                  <SidebarMenu>
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title} className="ml-6">
                        <SidebarMenuButton 
                          tooltip={subItem.title}
                          onClick={subItem.onClick}
                          className={subItem.isActive ? "bg-sibvi-cyan-700 text-sibvi-cyan-50 hover:bg-sibvi-cyan-700 hover:text-sibvi-cyan-50" : "text-sibvi-cyan-50 hover:bg-sibvi-cyan-700 hover:text-sibvi-cyan-50 active:bg-sibvi-cyan-700 active:text-sibvi-cyan-50"}
                        >
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
