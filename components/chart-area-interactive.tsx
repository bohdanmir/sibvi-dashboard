"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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

// Data source configuration - easily swap data sources here
const DATA_SOURCE_CONFIG = {
  csvPath: "/data/Baerlocher, MB 301, Stearin, Totals, AC Volume.csv",
  title: "Baerlocher MB 301 Stearin - AC Volume",
  description: "Monthly volume data from 2016 to 2025",
  dataKey: "volume",
  label: "Volume",
  referenceDate: "2025-06-01"
}

interface ChartDataPoint {
  date: string
  volume: number
}

const chartConfig = {
  [DATA_SOURCE_CONFIG.dataKey]: {
    label: DATA_SOURCE_CONFIG.label,
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("1y")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  React.useEffect(() => {
    const loadCSVData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(DATA_SOURCE_CONFIG.csvPath)
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`)
        }
        
        const csvText = await response.text()
        
        // Parse CSV data
        const lines = csvText.split('\n').filter(line => line.trim())
        const parsedData: ChartDataPoint[] = lines.slice(1).map(line => {
          const values = line.split(',')
          return {
            date: values[0],
            volume: parseInt(values[1]) || 0
          }
        }).filter(item => item.date && !isNaN(item.volume))
        
        setChartData(parsedData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading CSV data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        setLoading(false)
      }
    }

    loadCSVData()
  }, [])

  const filteredData = chartData.filter((item) => {
    if (timeRange === "All") return true
    
    const date = new Date(item.date)
    const referenceDate = new Date(DATA_SOURCE_CONFIG.referenceDate)
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

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Loading Chart Data...</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-muted-foreground">Loading data from CSV...</div>
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
        <CardTitle>{DATA_SOURCE_CONFIG.title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {DATA_SOURCE_CONFIG.description}
          </span>
          <span className="@[540px]/card:hidden">Monthly volume data</span>
        </CardDescription>
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
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-volume)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-volume)"
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
            <ChartTooltip
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
            <Area
              dataKey={DATA_SOURCE_CONFIG.dataKey}
              type="natural"
              fill="url(#fillVolume)"
              stroke="var(--color-volume)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
