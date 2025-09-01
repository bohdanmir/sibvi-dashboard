"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"

import { useIsMobile } from "@/hooks/use-mobile"
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Custom CSS for legend spacing
const legendStyles = `
  .recharts-legend-wrapper .recharts-legend-item {
    margin-right: 24px !important;
  }
`

export const description = "An interactive multi-series line chart with forecasts"

interface ChartDataPoint {
  date: string
  historical?: number
  [key: string]: string | number | undefined // For dynamic forecast series
}

interface Analysis {
  id: string
  name: string
  path: string
  metadata?: Record<string, unknown>
}

const chartConfig = {
  // Chart now supports light/dark themes with dynamic colors
} satisfies ChartConfig

// Colors for different forecast series
const forecastColors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1",
  "#d084d0", "#ff8042", "#00c49f", "#ffbb28", "#ff6b6b"
]

export function ChartAreaInteractive({ 
  timeRange, 
  onTimeRangeChange,
  onLoadingChange
}: { 
  timeRange?: string
  onTimeRangeChange?: (value: string) => void
  onLoadingChange?: (loading: boolean) => void
}) {
  const isMobile = useIsMobile()
  const { selectedDataset } = useDataset()
  const { theme } = useTheme()
  const [localTimeRange, setLocalTimeRange] = React.useState("1y")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string>("")
  const [analyses, setAnalyses] = React.useState<Analysis[]>([])
  const [availableAnalyses, setAvailableAnalyses] = React.useState<string[]>([])
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(new Set())

  // Use external timeRange if provided, otherwise use local state
  const currentTimeRange = timeRange || localTimeRange
  const setCurrentTimeRange = onTimeRangeChange || setLocalTimeRange

  React.useEffect(() => {
    if (isMobile) {
      setCurrentTimeRange("6m")
    }
  }, [isMobile, setCurrentTimeRange])

  // Notify parent component of loading state changes
  React.useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])

  // Load all data (analyses, forecasts, and chart data) when selected dataset changes
  // This prevents the chart from flickering by loading everything in one operation
  // and only rendering when all data is ready
  React.useEffect(() => {
    if (!selectedDataset) return

    const loadAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Step 1: Load analyses and check for forecast availability
        const analysesResponse = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
        if (!analysesResponse.ok) {
          throw new Error('Failed to load analyses')
        }
        
        const analysesData = await analysesResponse.json()
        setAnalyses(analysesData)
        
        // Step 2: Check which analyses have forecast data
        const availableForecastsSet = new Set<string>()
        const analysesWithForecasts = await Promise.all(
          analysesData.map(async (analysis: Analysis) => {
            try {
              const forecastResponse = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses/${analysis.id}/forecast`)
              if (forecastResponse.ok) {
                availableForecastsSet.add(analysis.id)
                return analysis.id
              }
              return null
            } catch {
              return null
            }
          })
        )
        
        const availableAnalysesList = analysesWithForecasts.filter(id => id !== null) as string[]
        setAvailableAnalyses(availableAnalysesList)
        
        // Step 3: Get folder information to find the CSV file
        const folderResponse = await fetch('/api/data-folders')
        if (!folderResponse.ok) {
          throw new Error('Failed to get folder information')
        }
        
        const folders = await folderResponse.json()
        const currentFolder = folders.find((f: { title: string; files?: string[] }) => f.title === selectedDataset.title)
        
        if (!currentFolder || !currentFolder.files || currentFolder.files.length === 0) {
          throw new Error('No CSV files found in selected folder')
        }
        
        // Step 4: Load historical data
        const csvFileName = currentFolder.files[0]
        const csvPath = `/data/${encodeURIComponent(selectedDataset.title)}/${encodeURIComponent(csvFileName)}`
        
        const csvResponse = await fetch(csvPath)
        if (!csvResponse.ok) {
          throw new Error(`Failed to load CSV data: ${csvResponse.status}`)
        }
        
        const csvText = await csvResponse.text()
        const historicalData = parseCSV(csvText)
        
        // Step 5: Load forecast data for all available analyses
        const forecastData = availableAnalysesList.length > 0 
          ? await loadForecastData(availableAnalysesList)
          : {}
        
        console.log('Historical data:', historicalData)
        console.log('Forecast data:', forecastData)
        
        // Step 6: Combine all data and set state
        const combinedData = combineData(historicalData, forecastData)
        console.log('Combined data:', combinedData)
        
        setChartData(combinedData)
        setFileName(csvFileName)
        setLoading(false)
      } catch (error) {
        console.error('Error loading all data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        setLoading(false)
      }
    }

    loadAllData()
  }, [selectedDataset])

  const loadForecastData = async (analysisIds: string[]) => {
    const forecasts: { [key: string]: { dates: string[]; forecastValues: number[]; totalPoints: number } } = {}
    
    for (const analysisId of analysisIds) {
      try {
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset!.title)}/analyses/${analysisId}/forecast`)
        if (response.ok) {
          const data = await response.json()
          forecasts[analysisId] = data
        } else {
          console.warn(`Analysis ${analysisId} has no forecast data (${response.status})`)
        }
      } catch (error) {
        console.error(`Error loading forecast for analysis ${analysisId}:`, error)
      }
    }
    
    return forecasts
  }

  const combineData = (historical: ChartDataPoint[], forecasts: { [key: string]: { dates: string[]; forecastValues: number[]; totalPoints: number } }) => {
    const combined: { [key: string]: ChartDataPoint } = {}
    
    console.log('Combining data - historical:', historical.length, 'forecasts:', Object.keys(forecasts))
    
    // Add historical data
    historical.forEach(item => {
      combined[item.date] = { ...item }
    })
    
    // Add forecast data
    Object.entries(forecasts).forEach(([analysisId, forecastData]) => {
      console.log(`Processing forecast for analysis ${analysisId}:`, forecastData)
      if (forecastData.dates && forecastData.forecastValues) {
        forecastData.dates.forEach((date: string, index: number) => {
          if (!combined[date]) {
            combined[date] = { date }
          }
          combined[date][`forecast_${analysisId}`] = forecastData.forecastValues[index]
        })
      }
    })
    
    const result = Object.values(combined).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    console.log('Final combined data:', result)
    return result
  }

  const parseCSV = (csvText: string): ChartDataPoint[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',')
      const baseValue = parseFloat(values[1]) || 0
      return {
        date: values[0],
        historical: parseFloat(values[1]) || 0
      }
    }).filter(item => item.date && !isNaN(item.historical!))
  }

  const filteredData = chartData.filter((item) => {
    if (currentTimeRange === "All") return true
    
    const date = new Date(item.date)
    
    // Always include forecast data (future dates)
    const hasForecastData = availableAnalyses.some(analysisId => 
      item[`forecast_${analysisId}`] !== undefined
    )
    if (hasForecastData) {
      console.log('Including item with forecast data:', item.date, item)
      return true
    }
    
    // For historical data, apply time range filtering
    let monthsToSubtract = 12 // Default to 1 year
    
    switch (currentTimeRange) {
      case "6m":
        monthsToSubtract = 6
        break
      case "1y":
        monthsToSubtract = 12
        break
      case "3y":
        monthsToSubtract = 36
        break
      case "5y":
        monthsToSubtract = 60
        break
      default:
        monthsToSubtract = 12
    }
    
    // Use current date as reference for historical data filtering
    const referenceDate = new Date()
    const startDate = new Date(referenceDate)
    startDate.setMonth(startDate.getMonth() - monthsToSubtract)
    
    const shouldInclude = date >= startDate
    if (!shouldInclude) {
      console.log('Filtering out historical item:', item.date, 'startDate:', startDate)
    }
    return shouldInclude
  })

  console.log('Filtered data:', filteredData)



  if (!selectedDataset) {
    return (
      <div className="flex items-center justify-center h-[250px]">
        <div className="text-muted-foreground">Please select a dataset from the sidebar</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <div className="aspect-auto h-[400px] w-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-center h-[250px]">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    )
  }

  // Don't render chart until we have data and analyses loaded
  // This ensures no flickering between historical-only and historical+forecast views
  if (!chartData.length || !analyses.length) {
    return (
      <div>
        <div className="aspect-auto h-[400px] w-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: legendStyles }} />

      {/* Chart Header with Scale Controls */}
      <div className="flex items-center justify-start mb-4">
        {/* Chart Scale Controls */}
        <div className="flex">
          <ToggleGroup
            type="single"
            value={currentTimeRange}
            onValueChange={setCurrentTimeRange}
            variant="outline"
            disabled={loading}
            className="hidden md:flex"
          >
            <ToggleGroupItem value="6m" disabled={loading} className="px-3 py-2">6m</ToggleGroupItem>
            <ToggleGroupItem value="1y" disabled={loading} className="px-3 py-2">1y</ToggleGroupItem>
            <ToggleGroupItem value="3y" disabled={loading} className="px-3 py-2">3y</ToggleGroupItem>
            <ToggleGroupItem value="5y" disabled={loading} className="px-3 py-2">5y</ToggleGroupItem>
            <ToggleGroupItem value="All" disabled={loading} className="px-3 py-2">All</ToggleGroupItem>
          </ToggleGroup>
          <Select value={currentTimeRange} onValueChange={setCurrentTimeRange} disabled={loading}>
            <SelectTrigger
              className="flex w-40 md:hidden"
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
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[400px] w-full"
      >
        {/* Show loading skeleton while chart data is being prepared to prevent layout shifts */}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin"></div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData}
            key={currentTimeRange}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
              tickFormatter={(value) => {
                return value.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              }}
            />
            <Tooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Legend 
              verticalAlign="bottom" 
              align="left"
              wrapperStyle={{ paddingTop: '20px' }}
              onClick={(entry) => {
                const seriesName = entry.dataKey as string
                setHiddenSeries(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(seriesName)) {
                    newSet.delete(seriesName)
                  } else {
                    newSet.add(seriesName)
                  }
                  return newSet
                })
              }}
            />
            
            {/* Historical Data Line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke={theme === "dark" ? "#ffffff" : "#000000"} // Dark black line like drivers info card
              strokeWidth={1}
              dot={{ fill: theme === "dark" ? "#374151" : "#f9fafb", stroke: theme === "dark" ? "#ffffff" : "#000000", strokeWidth: 1, r: 3 }}
              activeDot={{ r: 4, fill: theme === "dark" ? "#374151" : "#f9fafb", stroke: theme === "dark" ? "#ffffff" : "#000000" }}
              name="Historical Data"
              strokeDasharray="0" // Solid line for historical data
              hide={hiddenSeries.has('historical')}
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={0}
              animationEasing="ease-out"
            />
            
            {/* Forecast Lines */}
            {availableAnalyses.map((analysisId: string, index: number) => {
              const analysis = analyses.find(a => a.id === analysisId)
              const color = forecastColors[index % forecastColors.length]
              const dataKey = `forecast_${analysisId}`
              
              return (
                <Line
                  key={analysisId}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray="4 2" // Dashed line for forecasts - longer dashes with bigger gaps
                  dot={{ fill: theme === "dark" ? "#374151" : "#f9fafb", stroke: color, strokeWidth: 1, r: 3, strokeDasharray: "0" }}
                  activeDot={{ r: 4, fill: color, stroke: theme === "dark" ? "#ffffff" : "#000000" }}
                  name={`${analysis?.name || `${analysisId}`}`}
                  hide={hiddenSeries.has(dataKey)}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationBegin={0}
                  animationEasing="ease-out"
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  )
}
