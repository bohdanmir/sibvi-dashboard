"use client"

import * as React from "react"

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useDataset } from "@/lib/dataset-context"

// New schema for forecast data
export const forecastSchema = z.object({
  id: z.string(),
  date: z.string(),
  forecast: z.number(),
  quantiles: z.record(z.string(), z.number()).optional(),
  analysisId: z.string(),
  samples: z.array(z.number()).optional(),
})



const getColumns = (
  riskTolerance: 'conservative' | 'optimistic' | 'aggressive', 
  quantileKeys?: string[],
  setCustomLowerQuantile?: (quantile: string) => void,
  setCustomUpperQuantile?: (quantile: string) => void,
  customLowerQuantile?: string | null,
  customUpperQuantile?: string | null,
  customLowerChartValue?: string | null,
  customUpperChartValue?: string | null,
  setCustomLowerChartValue?: (value: string) => void,
  setCustomUpperChartValue?: (value: string) => void
): ColumnDef<z.infer<typeof forecastSchema>>[] => {
  const baseColumns: ColumnDef<z.infer<typeof forecastSchema>>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <div className="font-medium">
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
            }).format(date)}
          </div>
        );
      },
      enableHiding: false,
    },
      {
        accessorKey: "forecast",
        header: () => <div className="text-right">Forecast</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.forecast.toLocaleString()}
          </div>
        ),
      },
  ]

  // Add quantile columns based on risk tolerance and available quantiles
  if (quantileKeys && quantileKeys.length > 0) {
    if (riskTolerance === 'conservative') {
      // Use custom quantiles if set, otherwise show lowest and highest available quantiles (90% confidence)
      const lowestQuantile = customLowerQuantile || quantileKeys[0]
      const highestQuantile = customUpperQuantile || quantileKeys[quantileKeys.length - 1]
      
      baseColumns.push(
        {
          accessorKey: `quantiles.${lowestQuantile}`,
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Lower ({(parseFloat(lowestQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomLowerQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[lowestQuantile] ? row.original.quantiles[lowestQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(lowestQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: `quantiles.${highestQuantile}`,
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Upper ({(parseFloat(highestQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomUpperQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[highestQuantile] ? row.original.quantiles[highestQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(highestQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: "discrete-lower",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    {customLowerChartValue ? `Lower (${parseFloat(customLowerChartValue).toLocaleString()})` : 'Lower (Chart Scale)'} ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {generateDiscreteValues().map((value, index) => (
                    <DropdownMenuItem
                      key={`${value}-${index}`}
                      onClick={() => setCustomLowerChartValue?.(value.toString())}
                      className="text-right"
                    >
                      {value.toLocaleString()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: ({ row }) => {
            if (!customLowerChartValue) return <div className="text-right">-</div>;
            
            const targetValue = parseFloat(customLowerChartValue);
            if (isNaN(targetValue)) return <div className="text-right">-</div>;
            
            if (row.original.samples) {
              const quantile = findClosestValueQuantile(row.original.samples, targetValue);
              return (
                <div className="text-right">
                  {quantile}%
                </div>
              );
            }
            
            return <div className="text-right">-</div>;
          },
        },
        {
          accessorKey: "discrete-upper",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    {customUpperChartValue ? `Upper (${parseFloat(customUpperChartValue).toLocaleString()})` : 'Upper (Chart Scale)'} ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {generateDiscreteValues().map((value, index) => (
                    <DropdownMenuItem
                      key={`${value}-${index}`}
                      onClick={() => setCustomUpperChartValue?.(value.toString())}
                      className="text-right"
                    >
                      {value.toLocaleString()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: ({ row }) => {
            if (!customUpperChartValue) return <div className="text-right">-</div>;
            
            const targetValue = parseFloat(customUpperChartValue);
            if (isNaN(targetValue)) return <div className="text-right">-</div>;
            
            if (row.original.samples) {
              const quantile = findClosestValueQuantile(row.original.samples, targetValue);
              return (
                <div className="text-right">
                  {quantile}%
                </div>
              );
            }
            
            return <div className="text-right">-</div>;
          },
        }
      )
    } else if (riskTolerance === 'optimistic') {
      // Show 20% and 80% position quantiles (80% confidence)
      const lowerIndex = Math.floor(quantileKeys.length * 0.2)
      const upperIndex = Math.floor(quantileKeys.length * 0.8)
      const lowerQuantile = quantileKeys[lowerIndex]
      const upperQuantile = quantileKeys[upperIndex]
      
      baseColumns.push(
        {
          accessorKey: `quantiles.${lowerQuantile}`,
          header: () => <div className="text-right">Lower ({(parseFloat(lowerQuantile) * 100).toFixed(0)}%)</div>,
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[lowerQuantile] ? row.original.quantiles[lowerQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(lowerQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: `quantiles.${upperQuantile}`,
          header: () => <div className="text-right">Upper ({(parseFloat(upperQuantile) * 100).toFixed(0)}%)</div>,
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[upperQuantile] ? row.original.quantiles[upperQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(upperQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: "empty-lower-optimistic",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Lower ({(parseFloat(lowerQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomLowerQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: () => <div className="text-right">-</div>,
        },
        {
          accessorKey: "empty-upper-optimistic",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Upper ({(parseFloat(upperQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomUpperQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: () => <div className="text-right">-</div>,
        }
      )
    } else if (riskTolerance === 'aggressive') {
      // Show 40% and 60% position quantiles (50% confidence)
      const lowerIndex = Math.floor(quantileKeys.length * 0.4)
      const upperIndex = Math.floor(quantileKeys.length * 0.6)
      const lowerQuantile = quantileKeys[lowerIndex]
      const upperQuantile = quantileKeys[upperIndex]
      
      baseColumns.push(
        {
          accessorKey: `quantiles.${lowerQuantile}`,
          header: () => <div className="text-right">Lower ({(parseFloat(lowerQuantile) * 100).toFixed(0)}%)</div>,
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[lowerQuantile] ? row.original.quantiles[lowerQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(lowerQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: `quantiles.${upperQuantile}`,
          header: () => <div className="text-right">Upper ({(parseFloat(upperQuantile) * 100).toFixed(0)}%)</div>,
          cell: ({ row }) => (
            <div className="text-right">
              {row.original.quantiles?.[upperQuantile] ? row.original.quantiles[upperQuantile].toLocaleString() : 
               row.original.samples ? quantileFinder(row.original.samples, parseFloat(upperQuantile) * 100).toLocaleString() : 'N/A'}
            </div>
          ),
        },
        {
          accessorKey: "empty-lower-aggressive",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Lower ({(parseFloat(lowerQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomLowerQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: () => <div className="text-right">-</div>,
        },
        {
          accessorKey: "empty-upper-aggressive",
          header: () => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 font-normal">
                    Upper ({(parseFloat(upperQuantile) * 100).toFixed(0)}%) ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quantileKeys?.map((quantile) => (
                    <DropdownMenuItem
                      key={quantile}
                      onClick={() => setCustomUpperQuantile?.(quantile)}
                      className="text-right"
                    >
                      {(parseFloat(quantile) * 100).toFixed(0)}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          cell: () => <div className="text-right">-</div>,
        }
      )
    }
  }

  baseColumns.push({
    id: "actions",
    header: () => null,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <IconDotsVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  })

  return baseColumns
}

function TableRowComponent({ row }: { row: Row<z.infer<typeof forecastSchema>> }) {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// Helper function to find the closest quantile in a list
const findClosestQuantile = (targetQuantile: string, availableQuantiles: string[]): string => {
  const target = parseFloat(targetQuantile)
  let closest = availableQuantiles[0]
  let minDiff = Math.abs(parseFloat(closest) - target)
  
  for (const quantile of availableQuantiles) {
    const diff = Math.abs(parseFloat(quantile) - target)
    if (diff < minDiff) {
      minDiff = diff
      closest = quantile
    }
  }
  
  return closest
}

// Quantile finder function to calculate quantiles from samples
const quantileFinder = (samples: number[], quantile: number): number => {
  const p = quantile / 100;
  const index = (samples.length - 1) * p;
  return samples[Math.round(index)];
}

// Function to find the closest value in samples and return its quantile percentage
const findClosestValueQuantile = (samples: number[], targetValue: number): number => {
  if (!samples || samples.length === 0) return 0;
  
  // Sort samples for binary search
  const sortedSamples = [...samples].sort((a, b) => a - b);
  
  // Find the closest value
  let closestIndex = 0;
  let minDiff = Math.abs(sortedSamples[0] - targetValue);
  
  for (let i = 1; i < sortedSamples.length; i++) {
    const diff = Math.abs(sortedSamples[i] - targetValue);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  
  // Calculate quantile percentage
  const quantile = (closestIndex / (sortedSamples.length - 1)) * 100;
  return Math.round(quantile);
}

// Helper function to generate static discrete values from 0 to 1,600,000 with 100,000 steps
const generateDiscreteValues = (): number[] => {
  const values: number[] = []
  for (let i = 0; i <= 16; i++) {
    values.push(i * 100000)
  }
  return values
}

export function DataTable() {
  const { selectedDataset } = useDataset()
  const [analyses, setAnalyses] = React.useState<{ id: string; title?: string; name?: string }[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<string>("")
  const [forecastData, setForecastData] = React.useState<z.infer<typeof forecastSchema>[]>([])
  const [allForecastData, setAllForecastData] = React.useState<Record<string, z.infer<typeof forecastSchema>[]>>({})
  const [loading, setLoading] = React.useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false)
  const [riskTolerance, setRiskTolerance] = React.useState<'conservative' | 'optimistic' | 'aggressive'>('conservative')
  const [customLowerQuantile, setCustomLowerQuantile] = React.useState<string | null>(null)
  const [customUpperQuantile, setCustomUpperQuantile] = React.useState<string | null>(null)
  const [customLowerChartValue, setCustomLowerChartValue] = React.useState<string | null>(null)
  const [customUpperChartValue, setCustomUpperChartValue] = React.useState<string | null>(null)

  
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Load analyses and preload all forecast data when dataset changes
  React.useEffect(() => {
    if (selectedDataset) {
      loadAnalysesAndForecasts()
    }
  }, [selectedDataset])

  // Switch forecast data instantly when analysis changes
  React.useEffect(() => {
    if (selectedAnalysis && allForecastData[selectedAnalysis]) {
      setForecastData(allForecastData[selectedAnalysis])
      
      // Get quantiles for the new analysis
      const newData = allForecastData[selectedAnalysis]
      if (newData.length > 0 && newData[0].quantiles) {
        const newQuantileKeys = Object.keys(newData[0].quantiles).sort((a, b) => parseFloat(a) - parseFloat(b))
        
        // Find closest quantiles for custom selections if they don't exist in the new dataset
        if (customLowerQuantile && !newQuantileKeys.includes(customLowerQuantile)) {
          const closestLower = findClosestQuantile(customLowerQuantile, newQuantileKeys)
          setCustomLowerQuantile(closestLower)
        }
        
        if (customUpperQuantile && !newQuantileKeys.includes(customUpperQuantile)) {
          const closestUpper = findClosestQuantile(customUpperQuantile, newQuantileKeys)
          setCustomUpperQuantile(closestUpper)
        }
      }
    }
  }, [selectedAnalysis, allForecastData, customLowerQuantile, customUpperQuantile])

  // Regenerate table when risk tolerance changes
  React.useEffect(() => {
    // Reset custom quantiles when risk tolerance changes
    setCustomLowerQuantile(null)
    setCustomUpperQuantile(null)
    // Reset custom chart values when risk tolerance changes
    setCustomLowerChartValue(null)
    setCustomUpperChartValue(null)
    // Force table to re-render with new columns
    table?.resetColumnFilters()
  }, [riskTolerance])

  const loadAnalysesAndForecasts = async () => {
    if (!selectedDataset) return
    
    setLoading(true)
    try {
      // Load analyses first
      const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
      if (response.ok) {
        const analysesData = await response.json()
        setAnalyses(analysesData)
        
        if (analysesData.length > 0) {
          const firstAnalysisId = analysesData[0].id
          setSelectedAnalysis(firstAnalysisId)
          
                             // Preload all forecast data for all analyses
                   const forecasts: Record<string, z.infer<typeof forecastSchema>[]> = {}
                   
                   await Promise.all(
                     analysesData.map(async (analysis: { id: string; title?: string; name?: string }) => {
                       try {
                         const forecastResponse = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses/${analysis.id}/forecast`)
                         if (forecastResponse.ok) {
                           const data = await forecastResponse.json()
                           
                           // Transform the forecast data
                           const transformedData: z.infer<typeof forecastSchema>[] = []
                           
                           if (data.forecastValues && data.dates) {
                             data.dates.forEach((date: string, index: number) => {
                               // Create quantiles object from all available quantile data
                               const quantiles: Record<string, number> = {}
                               if (data.allQuantiles) {
                                 Object.entries(data.allQuantiles).forEach(([quantileKey, quantileValues]) => {
                                   if (quantileValues && Array.isArray(quantileValues) && quantileValues[index] !== null) {
                                     quantiles[quantileKey] = quantileValues[index] as number
                                   }
                                 })
                               }
                               
                               // Store forecast samples for dynamic quantile calculation
                               const samples = data.allSamples?.[date]
                               
                               transformedData.push({
                                 id: `${analysis.id}-${date}`,
                                 date: date,
                                 forecast: data.forecastValues[index],
                                 quantiles: Object.keys(quantiles).length > 0 ? quantiles : undefined,
                                 analysisId: analysis.id,
                                 // Store samples for dynamic quantile calculation
                                 samples: samples || undefined,
                               })
                             })
                           }
                           
                           forecasts[analysis.id] = transformedData
                         }
                       } catch (error) {
                         console.error(`Error loading forecast for analysis ${analysis.id}:`, error)
                         forecasts[analysis.id] = []
                       }
                     })
                   )
          
          setAllForecastData(forecasts)
          
          // Set initial forecast data for first analysis
          if (forecasts[firstAnalysisId]) {
            setForecastData(forecasts[firstAnalysisId])
          }
        }
      }
    } catch (error) {
      console.error('Error loading analyses and forecasts:', error)
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }





  // Get quantile keys from the first forecast data item if available
  const quantileKeys = forecastData.length > 0 && forecastData[0].quantiles 
    ? Object.keys(forecastData[0].quantiles).sort((a, b) => parseFloat(a) - parseFloat(b))
    : []

  const columns = getColumns(riskTolerance, quantileKeys, setCustomLowerQuantile, setCustomUpperQuantile, customLowerQuantile, customUpperQuantile, customLowerChartValue, customUpperChartValue, setCustomLowerChartValue, setCustomUpperChartValue);
  
  const table = useReactTable({
    data: forecastData,
    columns: columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })



  if (!selectedDataset) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Please select a dataset to view forecast data</p>
        </div>
      </div>
    )
  }

  return (
    <Tabs
      value={selectedAnalysis}
      onValueChange={setSelectedAnalysis}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Analysis
        </Label>
        <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select an analysis" />
          </SelectTrigger>
          <SelectContent>
            {analyses.map((analysis) => (
              <SelectItem key={analysis.id} value={analysis.id}>
                {analysis.name || `Analysis ${analysis.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={selectedAnalysis}
          onValueChange={setSelectedAnalysis}
          variant="outline"
          className="hidden @4xl/main:flex"
        >
          {analyses.map((analysis) => (
            <ToggleGroupItem key={analysis.id} value={analysis.id} className="px-3 py-2">
              {analysis.name || `Analysis ${analysis.id}`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

      </div>
      <TabsContent value={selectedAnalysis} className="flex flex-col px-4 lg:px-6">
        {!initialLoadComplete ? (
          <div className="flex items-center justify-center p-8">
            <IconLoader className="mr-2 h-4 w-4 animate-spin" />
            Loading analyses and forecasts...
          </div>
        ) : forecastData.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No forecast data available for this analysis</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRowComponent key={row.id} row={row} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={getColumns(riskTolerance, quantileKeys, setCustomLowerQuantile, setCustomUpperQuantile, customLowerQuantile, customUpperQuantile, customLowerChartValue, customUpperChartValue, setCustomLowerChartValue, setCustomUpperChartValue).length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof forecastSchema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.date}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.date}</DrawerTitle>
          <DrawerDescription>
            Forecast: {item.forecast.toLocaleString()}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="date">Date</Label>
              <Input id="date" defaultValue={item.date} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="forecast">Forecast Value</Label>
                <Input id="forecast" defaultValue={item.forecast.toString()} />
              </div>

            </div>
            {item.quantiles && Object.keys(item.quantiles).length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="lower-quantile">Lower Bound</Label>
                  <Input 
                    id="lower-quantile" 
                    defaultValue={Object.values(item.quantiles)[0]?.toString() || ''} 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="upper-quantile">Upper Bound</Label>
                  <Input 
                    id="upper-quantile" 
                    defaultValue={Object.values(item.quantiles)[Object.keys(item.quantiles).length - 1]?.toString() || ''} 
                  />
                </div>
              </div>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
