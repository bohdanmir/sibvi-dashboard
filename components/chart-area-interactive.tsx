"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useDataset } from "@/lib/dataset-context"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
  // Historical data uses hardcoded black color for consistency with drivers info card
} satisfies ChartConfig

// Colors for different forecast series
const forecastColors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1",
  "#d084d0", "#ff8042", "#00c49f", "#ffbb28", "#ff6b6b"
]

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { selectedDataset } = useDataset()
  const [timeRange, setTimeRange] = React.useState("1y")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string>("")
  const [analyses, setAnalyses] = React.useState<Analysis[]>([])
  const [availableAnalyses, setAvailableAnalyses] = React.useState<string[]>([])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  // Load analyses when selected dataset changes
  React.useEffect(() => {
    if (!selectedDataset) return

    const loadAnalyses = async () => {
      try {
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
        if (response.ok) {
          const analysesData = await response.json()
          setAnalyses(analysesData)
          
          // Check which analyses actually have forecast data and select all available ones
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
          
          setAvailableAnalyses(analysesWithForecasts.filter(id => id !== null) as string[])
        }
      } catch (error) {
        console.error('Error loading analyses:', error)
      }
    }

    loadAnalyses()
  }, [selectedDataset])

  // Load chart data when selected dataset or analyses change
  React.useEffect(() => {
    if (!selectedDataset) return

    const loadChartData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get folder information to find the CSV file
        const folderResponse = await fetch('/api/data-folders')
        if (!folderResponse.ok) {
          throw new Error('Failed to get folder information')
        }
        
        const folders = await folderResponse.json()
        const currentFolder = folders.find((f: { title: string; files?: string[] }) => f.title === selectedDataset.title)
        
        if (!currentFolder || !currentFolder.files || currentFolder.files.length === 0) {
          throw new Error('No CSV files found in selected folder')
        }
        
        // Use the first CSV file in the folder
        const csvFileName = currentFolder.files[0]
        const csvPath = `/data/${encodeURIComponent(selectedDataset.title)}/${encodeURIComponent(csvFileName)}`
        
        const response = await fetch(csvPath)
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`)
        }
        
        const csvText = await response.text()
        const historicalData = parseCSV(csvText)
        
        // Load forecast data for all available analyses
        const forecastData = availableAnalyses.length > 0 
          ? await loadForecastData(availableAnalyses)
          : {}
        
        console.log('Historical data:', historicalData)
        console.log('Forecast data:', forecastData)
        
        // Combine historical and forecast data
        const combinedData = combineData(historicalData, forecastData)
        console.log('Combined data:', combinedData)
        
        setChartData(combinedData)
        setFileName(csvFileName)
        setLoading(false)
      } catch (error) {
        console.error('Error loading chart data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        setLoading(false)
      }
    }

    loadChartData()
  }, [selectedDataset, availableAnalyses])

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
      return {
        date: values[0],
        historical: parseFloat(values[1]) || 0
      }
    }).filter(item => item.date && !isNaN(item.historical!))
  }

  const filteredData = chartData.filter((item) => {
    if (timeRange === "All") return true
    
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
    
    switch (timeRange) {
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
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>No Dataset Selected</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-muted-foreground">Please select a dataset from the sidebar</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Loading Chart Data...</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-muted-foreground">Loading data from {selectedDataset.title}...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle>{selectedDataset.title}</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              {fileName ? `Data from: ${fileName}` : "Dataset information"}
            </span>
            <span className="@[540px]/card:hidden">
              {fileName ? fileName : "Dataset info"}
            </span>
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="6m">6m</ToggleGroupItem>
            <ToggleGroupItem value="1y">1y</ToggleGroupItem>
            <ToggleGroupItem value="3y">3y</ToggleGroupItem>
            <ToggleGroupItem value="5y">5y</ToggleGroupItem>
            <ToggleGroupItem value="All">All</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
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
        </CardAction>
      </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
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
              />
              
              {/* Historical Data Line */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#000000" // Dark black line like drivers info card
                strokeWidth={1}
                dot={{ fill: "#ffffff", stroke: "#000000", strokeWidth: 1, r: 3 }}
                activeDot={{ r: 4 }}
                name="Historical Data"
                strokeDasharray="0" // Solid line for historical data
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
                    dot={{ fill: "#ffffff", stroke: color, strokeWidth: 1, r: 3, strokeDasharray: "0" }}
                    activeDot={{ r: 4 }}
                    name={`${analysis?.name || `Analysis ${analysisId}`} (Forecast)`}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
