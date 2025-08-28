import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDataset } from "@/lib/dataset-context"

export function SiteHeader() {
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
          <Button 
            size="sm"
            className="bg-sibvi-cyan-200 text-sibvi-cyan-900 hover:bg-sibvi-cyan-300 active:bg-sibvi-cyan-400 duration-200 ease-linear"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Forecast
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
