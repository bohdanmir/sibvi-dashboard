"use client"

import * as React from "react"
import {
  Camera,
  ChartBar,
  House,
  Database,
  File,
  FileText,
  FileDoc,
  Folder,
  Question,
  Circle,
  List,
  ChartPie,
  MagnifyingGlass,
  Gear,
  Users,
} from "@phosphor-icons/react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { useDataset } from "@/lib/dataset-context"

const data = {
  user: {
    name: "Ralf Gelshorn",
    email: "user@baerlocher.com",
    avatar: "/baerlocher1.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: House,
    },
    {
      title: "Datasets",
      url: "#",
      icon: Database,
      items: [], // Will be populated dynamically
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: Camera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileText,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: File,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Gear,
    },
    {
      title: "Get Help",
      url: "#",
      icon: Question,
    },
    {
      title: "Search",
      url: "#",
      icon: MagnifyingGlass,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ChartPie,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileDoc,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { selectedDataset, setSelectedDataset, availableDatasets, loading } = useDataset()

  // Create dataset navigation items with click handlers
  const datasetNavItems = availableDatasets.map(dataset => ({
    title: dataset.title,
    url: "#",
    onClick: () => setSelectedDataset(dataset),
    isActive: selectedDataset?.title === dataset.title
  }))

  // Populate the Datasets menu item with actual datasets
  const navMainWithDatasets = data.navMain.map(item => {
    if (item.title === "Datasets") {
      return {
        ...item,
        items: datasetNavItems
      }
    }
    return item
  })

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FlickeringGrid 
          squareSize={1.5}
          gridGap={20}
          flickerChance={0.4}
          color="rgb(39, 209, 239)"
          maxOpacity={0.40}
          className="opacity-95"
        />
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 text-sibvi-cyan-50 hover:bg-sibvi-cyan-800 hover:text-sibvi-cyan-50 active:bg-sibvi-cyan-800"
              >
                <a href="#">
                  <img src="/logo-sibvi-2colours.svg" alt="Sibvi Logo" className="h-7 w-auto" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMainWithDatasets} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
