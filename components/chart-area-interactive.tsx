"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { Newspaper } from "lucide-react"

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
  onLoadingChange,
  onPinMonthChange
}: { 
  timeRange?: string
  onTimeRangeChange?: (value: string) => void
  onLoadingChange?: (loading: boolean) => void
  onPinMonthChange?: (month: string) => void
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

  // Pin state and functionality
  const [pinPosition, setPinPosition] = React.useState<number>(0) // 0-100 percentage
  const [isDraggingPin, setIsDraggingPin] = React.useState(false)
  const [hasPinBeenMoved, setHasPinBeenMoved] = React.useState(false) // Track if pin has been moved by user
  const chartRef = React.useRef<HTMLDivElement>(null)
  // Measured plot area inside the chart (excludes Y axis & margins)
  const [plotLeftPx, setPlotLeftPx] = React.useState<number>(0)
  const [plotWidthPx, setPlotWidthPx] = React.useState<number>(0)
  const [plotTopPx, setPlotTopPx] = React.useState<number>(0)
  const [plotHeightPx, setPlotHeightPx] = React.useState<number>(0)

  // Use external timeRange if provided, otherwise use local state
  const currentTimeRange = timeRange || localTimeRange
  const setCurrentTimeRange = onTimeRangeChange || setLocalTimeRange

  // Measure plot area (grid bounds) so the pin ignores Y-axis/legend width
  React.useLayoutEffect(() => {
    const measure = () => {
      if (!chartRef.current) return
      const container = chartRef.current
      const containerRect = container.getBoundingClientRect()
      const grid = container.querySelector('.recharts-cartesian-grid') as SVGGElement | null
      const surface = container.querySelector('svg.recharts-surface') as SVGSVGElement | null

      // Prefer calculating from grid lines (most accurate plot rect)
      const gridLines = grid?.querySelectorAll('line')
      if (gridLines && gridLines.length > 0) {
        let minLeft = Number.POSITIVE_INFINITY
        let maxRight = Number.NEGATIVE_INFINITY
        let minTop = Number.POSITIVE_INFINITY
        let maxBottom = Number.NEGATIVE_INFINITY
        gridLines.forEach((line) => {
          const r = (line as SVGLineElement).getBoundingClientRect()
          minLeft = Math.min(minLeft, r.left)
          maxRight = Math.max(maxRight, r.right)
          minTop = Math.min(minTop, r.top)
          maxBottom = Math.max(maxBottom, r.bottom)
        })
        if (isFinite(minLeft) && isFinite(maxRight) && maxRight > minLeft) {
          setPlotLeftPx(Math.max(0, minLeft - containerRect.left))
          setPlotWidthPx(Math.max(0, maxRight - minLeft))
          if (isFinite(minTop) && isFinite(maxBottom) && maxBottom > minTop) {
            setPlotTopPx(Math.max(0, minTop - containerRect.top))
            setPlotHeightPx(Math.max(0, maxBottom - minTop))
          }
          return
        }
      }

      if (surface) {
        const sRect = surface.getBoundingClientRect()
        setPlotLeftPx(Math.max(0, sRect.left - containerRect.left))
        setPlotWidthPx(Math.max(0, sRect.width))
        setPlotTopPx(Math.max(0, sRect.top - containerRect.top))
        setPlotHeightPx(Math.max(0, sRect.height))
      } else {
        setPlotLeftPx(0)
        setPlotWidthPx(containerRect.width)
        setPlotTopPx(0)
        setPlotHeightPx(containerRect.height)
      }
    }
    // Defer to next frame to ensure Recharts has laid out the grid
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure) }
  }, [chartData, currentTimeRange])

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





  // Start pin dragging (mouse and touch)
  const startPinDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDraggingPin(true)
  }

  // Get current month label for pin position based on actual data on X axis
  const getPinMonthLabel = () => {
    if (!filteredData.length) return "Jan"
    const totalPoints = filteredData.length
    const index = Math.round((pinPosition / 100) * (totalPoints - 1))
    const clampedIndex = Math.max(0, Math.min(totalPoints - 1, index))
    const dataPoint = filteredData[clampedIndex]
    if (dataPoint && dataPoint.date) {
      const date = new Date(dataPoint.date)
      return date.toLocaleDateString("en-US", { month: "short" })
    }
    return "Jan"
  }

  // Get full month and year for pin position to send to parent component
  const getPinMonthAndYear = () => {
    if (!filteredData.length) return null
    const totalPoints = filteredData.length
    const index = Math.round((pinPosition / 100) * (totalPoints - 1))
    const clampedIndex = Math.max(0, Math.min(totalPoints - 1, index))
    const dataPoint = filteredData[clampedIndex]
    if (dataPoint && dataPoint.date) {
      const date = new Date(dataPoint.date)
      const month = date.toLocaleDateString("en-US", { month: "long" })
      const year = date.getFullYear()
      return `${month} ${year}`
    }
    return null
  }

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
        // Add one extra data point one month earlier
        const firstForecastDate = new Date(forecastData.dates[0])
        const oneMonthEarlier = new Date(firstForecastDate)
        oneMonthEarlier.setMonth(oneMonthEarlier.getMonth() - 1)
        const oneMonthEarlierStr = oneMonthEarlier.toISOString().split('T')[0]
        
        // Find historical value for the same month
        const historicalValue = historical.find(item => {
          const itemDate = new Date(item.date)
          return itemDate.getMonth() === oneMonthEarlier.getMonth() && itemDate.getFullYear() === oneMonthEarlier.getFullYear()
        })?.historical
        
        if (historicalValue !== undefined) {
          if (!combined[oneMonthEarlierStr]) {
            combined[oneMonthEarlierStr] = { date: oneMonthEarlierStr }
          }
          combined[oneMonthEarlierStr][`forecast_${analysisId}`] = historicalValue
        }
        
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

  // Handle pin dragging with smooth movement and month snapping
  React.useEffect(() => {
    let animationFrameId: number | null = null
    let lastUpdateTime = 0
    const updateInterval = 16 // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPin || !chartRef.current) return

      const now = performance.now()
      if (now - lastUpdateTime < updateInterval) return
      lastUpdateTime = now

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = requestAnimationFrame(() => {
        const chartRect = chartRef.current!.getBoundingClientRect()
        const containerLeft = chartRect.left
        const effectiveLeft = containerLeft + plotLeftPx
        const effectiveWidth = plotWidthPx || chartRect.width

        // Calculate relative position within plotted area (ignoring Y axis width)
        const relativeX = e.clientX - effectiveLeft
        const percentage = Math.max(0, Math.min(100, (relativeX / effectiveWidth) * 100))

        // Enhanced month snapping: snap to nearest month boundary
        const totalPoints = filteredData.length
        if (totalPoints > 1) {
          const nearestIndex = Math.round((percentage / 100) * (totalPoints - 1))
          const clampedIndex = Math.max(0, Math.min(totalPoints - 1, nearestIndex))
          
          // Get the date for this index to determine month boundaries
          const dataPoint = filteredData[clampedIndex]
          if (dataPoint && dataPoint.date) {
            const currentDate = new Date(dataPoint.date)
            const currentMonth = currentDate.getMonth()
            const currentYear = currentDate.getFullYear()
            
            // Find the closest month boundary within the data range
            let bestIndex = clampedIndex
            let minDistance = Math.abs(clampedIndex - nearestIndex)
            
            // Check nearby data points for month boundaries
            for (let i = Math.max(0, clampedIndex - 2); i <= Math.min(totalPoints - 1, clampedIndex + 2); i++) {
              const point = filteredData[i]
              if (point && point.date) {
                const pointDate = new Date(point.date)
                const pointMonth = pointDate.getMonth()
                const pointYear = pointDate.getFullYear()
                
                // Check if this is a month boundary (first day of month or significant month change)
                const isMonthBoundary = pointDate.getDate() <= 3 || // First few days of month
                  (pointMonth !== currentMonth || pointYear !== currentYear)
                
                if (isMonthBoundary) {
                  const distance = Math.abs(i - nearestIndex)
                  if (distance < minDistance) {
                    minDistance = distance
                    bestIndex = i
                  }
                }
              }
            }
            
            const snappedPercentage = (bestIndex / (totalPoints - 1)) * 100
            setPinPosition(snappedPercentage)
          } else {
            const snappedPercentage = (clampedIndex / (totalPoints - 1)) * 100
            setPinPosition(snappedPercentage)
          }
        } else {
          setPinPosition(percentage)
        }
        
        // Mark that pin has been moved by user
        setHasPinBeenMoved(true)
      })
    }

    const handleMouseUp = () => {
      setIsDraggingPin(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingPin || !chartRef.current || e.touches.length !== 1) return
      
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
      })
      handleMouseMove(mouseEvent)
    }

    const handleTouchEnd = () => {
      setIsDraggingPin(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    if (isDraggingPin) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false })
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isDraggingPin, filteredData, plotLeftPx, plotWidthPx])

  // Notify parent component when pin month changes (only if pin has been moved by user)
  React.useEffect(() => {
    if (onPinMonthChange && filteredData.length > 0 && hasPinBeenMoved) {
      const monthAndYear = getPinMonthAndYear()
      console.log('Chart sending month to parent:', monthAndYear)
      console.log('Pin position:', pinPosition)
      console.log('Filtered data length:', filteredData.length)
      if (monthAndYear) {
        onPinMonthChange(monthAndYear)
      }
    }
  }, [pinPosition, filteredData, onPinMonthChange, hasPinBeenMoved])

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

      {/* Chart with overlay pin */}
      <div className="relative">
              <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[400px] w-full select-none"
        ref={chartRef}
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
            
            {/* Forecast Lines */}
            {availableAnalyses.map((analysisId: string, index: number) => {
              const analysis = analyses.find(a => a.id === analysisId)
              const color = forecastColors[index % forecastColors.length]
              const dataKey = `forecast_${analysisId}`
              
              return (
                <Line
                  key={`forecast-${analysisId}`}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray="4 2" // Dashed line for forecasts - longer dashes with bigger gaps
                  dot={(props) => {
                    const { index } = props
                    const forecastDataPoints = filteredData.filter(item => item[`forecast_${analysisId}`] !== undefined)
                    if (forecastDataPoints.length > 0 && index === filteredData.indexOf(forecastDataPoints[forecastDataPoints.length - 1])) {
                      return <circle key={`forecast-dot-${analysisId}-${index}`} cx={props.cx} cy={props.cy} r={3} fill={color} />
                    }
                    return <g key={`forecast-dot-empty-${analysisId}-${index}`} />
                  }}
                  activeDot={{ r: 6, fill: color, stroke: theme === "dark" ? "#000000" : "#FFFFFF", strokeWidth: 3, filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))" }}
                  name={`${analysis?.name || `${analysisId}`}`}
                  hide={hiddenSeries.has(dataKey)}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationBegin={0}
                  animationEasing="ease-out"
                />
              )
            })}
            
            {/* Historical Data Line */}
            <Line
              key="historical"
              type="monotone"
              dataKey="historical"
              stroke={theme === "dark" ? "#ffffff" : "#000000"} // Dark black line like drivers info card
              strokeWidth={1}
              dot={(props) => {
                const { index } = props
                const historicalDataPoints = filteredData.filter(item => item.historical !== undefined)
                if (historicalDataPoints.length > 0 && index === filteredData.indexOf(historicalDataPoints[historicalDataPoints.length - 1])) {
                  return <circle key={`historical-dot-${index}`} cx={props.cx} cy={props.cy} r={3} fill={theme === "dark" ? "#ffffff" : "#000000"} />
                }
                return <g key={`historical-dot-empty-${index}`} />
              }}
              activeDot={{ r: 6, fill: theme === "dark" ? "#ffffff" : "#000000", stroke: theme === "dark" ? "#000000" : "#FFFFFF", strokeWidth: 3, filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))" }}
              name="Historical Data"
              strokeDasharray="0" // Solid line for historical data
              hide={hiddenSeries.has('historical')}
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={0}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
        )}
        </ChartContainer>

        {/* Pin overlay positioned over the chart - completely non-interactive */}
        <div 
          className="absolute inset-0 pointer-events-none select-none"
          style={{ paddingTop: 0 }}
        >
          <div 
            className="absolute -left-[1px] w-0.5 bg-blue-500 z-10 pointer-events-none transition-all duration-150 ease-out"
            style={{ 
              left: plotLeftPx + (pinPosition / 100) * (plotWidthPx || 0),
              top: plotTopPx,
              height: plotHeightPx,
              opacity: isDraggingPin ? 0.8 : 1
            }}
          >
            <div 
              className="absolute -top-[12px] -left-[12px] w-6 h-6 bg-blue-500 rounded-full pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center select-none group transition-transform duration-150 ease-out hover:scale-110"
              onMouseDown={startPinDrag}
              onTouchStart={startPinDrag}
              aria-label="News pin"
              title={`Current month: ${getPinMonthAndYear() || "Loading..."}`}
            >
              <Newspaper className="w-3 h-3 text-white" aria-hidden="true" />
            </div>
            {/* Show current month while pin is being dragged */}
            {isDraggingPin && (
              <div className="absolute -top-[40px] -left-[20px] bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                {getPinMonthAndYear() || "Loading..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
