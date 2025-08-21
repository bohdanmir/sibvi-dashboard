"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DriversComparison } from "@/components/drivers-comparison"
import { WorldMapSection } from "@/components/world-map-section"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DatasetProvider, useDataset } from "@/lib/dataset-context"

import data from "./data.json"

function DashboardContent() {
  const { selectedDataset } = useDataset()
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="">
           <DriversComparison />
          </div>
          <div className="px-4 lg:px-6">
            <WorldMapSection key={selectedDataset?.title || 'no-dataset'} />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <DatasetProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <DashboardContent />
        </SidebarInset>
      </SidebarProvider>
    </DatasetProvider>
  )
}
