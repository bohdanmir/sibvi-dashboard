import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDataset } from "@/lib/dataset-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface SiteHeaderProps {
  timeRange?: string
  onTimeRangeChange?: (value: string) => void
  loading?: boolean
}

export function SiteHeader({ timeRange = "1y", onTimeRangeChange, loading = false }: SiteHeaderProps) {
  const { selectedDataset } = useDataset()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Acme Inc.</span>
          {selectedDataset && (
            <>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h1 className="text-sm font-medium">{selectedDataset.title}</h1>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Chart Scale Controls */}
          <div className="flex">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={onTimeRangeChange}
              variant="outline"
              disabled={loading}
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]:flex"
            >
              <ToggleGroupItem value="6m" disabled={loading}>6m</ToggleGroupItem>
              <ToggleGroupItem value="1y" disabled={loading}>1y</ToggleGroupItem>
              <ToggleGroupItem value="3y" disabled={loading}>3y</ToggleGroupItem>
              <ToggleGroupItem value="5y" disabled={loading}>5y</ToggleGroupItem>
              <ToggleGroupItem value="All" disabled={loading}>All</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={onTimeRangeChange} disabled={loading}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]:hidden"
                size="sm"
                aria-label="Select a value"
                disabled={loading}
              >
                <SelectValue placeholder="1 year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="6m" className="rounded-lg">
                  6 months
                </SelectItem>
                <SelectItem value="1y" className="rounded-lg">
                  1 year
                </SelectItem>
                <SelectItem value="3y" className="rounded-lg">
                  3 years
                </SelectItem>
                <SelectItem value="5y" className="rounded-lg">
                  5 years
                </SelectItem>
                <SelectItem value="All" className="rounded-lg">
                  All data
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            size="sm"
            className="bg-sibvi-cyan-200 text-sibvi-cyan-900 hover:bg-sibvi-cyan-300 active:bg-sibvi-cyan-400 duration-200 ease-linear"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Forecast
          </Button>
        </div>
      </div>
    </header>
  )
}
