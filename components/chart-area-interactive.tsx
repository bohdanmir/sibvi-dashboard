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
  ChartTooltip,
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
  [key: string]: any // For dynamic forecast series
}

interface Analysis {
  id: string
  name: string
  path: string
  metadata?: any
}

const chartConfig = {
  historical: {
    label: "Historical Data",
    color: "hsl(var(--primary))",
  },
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
  const [selectedAnalyses, setSelectedAnalyses] = React.useState<string[]>([])

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
          // Select first few analyses by default
          setSelectedAnalyses(analysesData.slice(0, 3).map((a: Analysis) => a.id))
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
        const currentFolder = folders.find((f: any) => f.title === selectedDataset.title)
        
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
        
        // Load forecast data for each selected analysis
        const forecastData = selectedAnalyses.length > 0 
          ? await loadForecastData(selectedAnalyses)
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
  }, [selectedDataset, selectedAnalyses])

  const loadForecastData = async (analysisIds: string[]) => {
    const forecasts: { [key: string]: any } = {}
    
    for (const analysisId of analysisIds) {
      try {
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset!.title)}/analyses/${analysisId}/forecast`)
        if (response.ok) {
          const data = await response.json()
          forecasts[analysisId] = data
        }
      } catch (error) {
        console.error(`Error loading forecast for analysis ${analysisId}:`, error)
      }
    }
    
    return forecasts
  }

  const combineData = (historical: ChartDataPoint[], forecasts: { [key: string]: any }) => {
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
    const hasForecastData = selectedAnalyses.some(analysisId => 
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

  const toggleAnalysis = (analysisId: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    )
  }

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
        {/* Analysis Selection */}
        {analyses.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Select Forecasts to Display:</div>
            <div className="flex flex-wrap gap-2">
              {analyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => toggleAnalysis(analysis.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedAnalyses.includes(analysis.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {analysis.name || `Analysis ${analysis.id}`}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
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
              <Legend />
              
              {/* Historical Data Line */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Historical Data"
                strokeDasharray="0" // Solid line for historical data
              />
              
              {/* Forecast Lines */}
              {selectedAnalyses.map((analysisId, index) => {
                const analysis = analyses.find(a => a.id === analysisId)
                const color = forecastColors[index % forecastColors.length]
                const dataKey = `forecast_${analysisId}`
                
                return (
                  <Line
                    key={analysisId}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="8 4" // More pronounced dashed pattern for forecasts
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
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
