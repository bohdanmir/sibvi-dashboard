"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

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

export const description = "An interactive area chart"

interface ChartDataPoint {
  date: string
  value: number
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { selectedDataset } = useDataset()
  const [timeRange, setTimeRange] = React.useState("1y")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string>("")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  // Load chart data when selected dataset changes
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
        const parsedData = parseCSV(csvText)
        setChartData(parsedData)
        setFileName(csvFileName)
        setLoading(false)
      } catch (error) {
        console.error('Error loading chart data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        setLoading(false)
      }
    }

    loadChartData()
  }, [selectedDataset])

  const parseCSV = (csvText: string): ChartDataPoint[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        date: values[0],
        value: parseFloat(values[1]) || 0
      }
    }).filter(item => item.date && !isNaN(item.value))
  }

  const filteredData = chartData.filter((item) => {
    if (timeRange === "All") return true
    
    const date = new Date(item.date)
    const referenceDate = new Date("2025-06-01") // You might want to make this dynamic
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
    
    const startDate = new Date(referenceDate)
    startDate.setMonth(startDate.getMonth() - monthsToSubtract)
    return date >= startDate
  })

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
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={filteredData}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
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
            <Line
              dataKey="value"
              type="natural"
              stroke="var(--color-value)"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
