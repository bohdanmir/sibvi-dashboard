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
import { useState } from "react"

import data from "./data.json"

function DashboardContent({ 
  timeRange, 
  setTimeRange,
  setLoading 
}: { 
  timeRange: string; 
  setTimeRange: (value: string) => void;
  setLoading: (loading: boolean) => void;
}) {
  const { selectedDataset } = useDataset()
  const [pinMonth, setPinMonth] = useState<string | undefined>(undefined)
  
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="@container/main flex flex-1 flex-col gap-2 max-w-8xl mx-auto w-full">
        <div className="flex flex-col gap-4 md:gap-6">
          <SectionCards 
            selectedMonth={pinMonth}
          />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive 
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onLoadingChange={setLoading}
              onPinMonthChange={setPinMonth}
            />
          </div>
          <div className="">
           <DriversComparison />
          </div>
          <div className="px-4 lg:px-6">
            <WorldMapSection key={selectedDataset?.title || 'no-dataset'} />
          </div>
          <DataTable />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [timeRange, setTimeRange] = useState("1y")
  const [loading, setLoading] = useState(false)
  
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
        <SidebarInset className="min-h-screen">
          <SiteHeader />
          <DashboardContent 
            timeRange={timeRange} 
            setTimeRange={setTimeRange}
            setLoading={setLoading}
          />
        </SidebarInset>
      </SidebarProvider>
    </DatasetProvider>
  )
}
