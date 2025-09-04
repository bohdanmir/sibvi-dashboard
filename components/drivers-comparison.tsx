"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkline } from "@/components/ui/sparkline"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataset } from "@/lib/dataset-context"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Animated Progress Bar Component
function AnimatedProgress({ value, className, ...props }: { value: number; className?: string; [key: string]: any }) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100) // Small delay to ensure smooth animation start

    return () => clearTimeout(timer)
  }, [value])

  return (
    <Progress 
      value={animatedValue} 
      className={`${className} [&>div]:transition-all [&>div]:duration-700 [&>div]:ease-out`}
      {...props}
    />
  )
}


interface AnalysisFolder {
  id: string
  name: string
  path: string
}

interface Category {
  id: number
  name: string
  importance: number
  driverCount: number // Add driver count to the category interface
}

interface Region {
  id: number
  name: string
  parent_id: number | null
  cumulativeImpact: number
}

interface Driver {
  id: string
  name: string
  importance: number
  category?: {
    id: number
    name: string
  }
}

interface Scenario {
  summary: string
}

type ViewMode = 'scenarios' | 'regions' | 'categories' | 'predictors'

interface DriverCardProps {
  title: string
  description: string
  categories?: Category[]
  regions?: Region[]
  drivers?: Driver[]
  scenario?: Scenario
  overallStatus: "on-track" | "at-risk" | "behind"
  trend: "up" | "down" | "stable"
  analysisId: string
  forecastData: number[]
  analysisIndex: number
  viewMode: ViewMode
}

function DriverCard({ title, description, categories, regions, drivers, scenario, overallStatus, trend, analysisId, forecastData, analysisIndex, viewMode }: DriverCardProps) {
  const { theme } = useTheme()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600 dark:text-green-400"
      case "at-risk":
        return "text-yellow-600 dark:text-yellow-400"
      case "behind":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      case "stable":
        return "→"
      default:
        return "→"
    }
  }

  // Generate sparkline data based on status
  const generateSparklineData = (status: string) => {
    switch (status) {
      case "on-track":
        return [20, 35, 45, 60, 75, 85, 90] // Upward trend
      case "at-risk":
        return [80, 70, 65, 55, 45, 40, 35] // Downward trend
      case "behind":
        return [90, 85, 80, 75, 70, 65, 60] // Steady decline
      default:
        return [50, 55, 50, 45, 50, 55, 50] // Flat line
    }
  }

  // Get sparkline colors based on status - using same colors as main forecast chart
  const getSparklineColor = (status: string, analysisId?: string, analysisIndex?: number) => {
    // Use the same colors as the main forecast chart
    const forecastColors = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1",
      "#d084d0", "#ff8042", "#00c49f", "#ffbb28", "#ff6b6b"
    ]
    
    // If we have an analysis index, use it to get the same color as the main chart
    if (analysisIndex !== undefined) {
      return forecastColors[analysisIndex % forecastColors.length]
    }
    
    // Fallback to status-based colors if no analysis index is available
    switch (status) {
      case "on-track":
        return forecastColors[1] // Green (#82ca9d)
      case "at-risk":
        return forecastColors[2] // Yellow (#ffc658)
      case "behind":
        return forecastColors[9] // Red (#ff6b6b)
      default:
        return forecastColors[0] // Purple (#8884d8)
    }
  }

  // Get real forecast data for sparkline
  const getForecastSparklineData = (): number[] => {
    if (forecastData && forecastData.length > 0) {
      // Normalize the data to fit nicely in the sparkline (0-100 range)
      const min = Math.min(...forecastData)
      const max = Math.max(...forecastData)
      const range = max - min || 1
      
      return forecastData.map((value: number) => ((value - min) / range) * 100)
    }
    
    // Fallback to status-based data if no forecast data available
    return generateSparklineData(overallStatus)
  }

  return (
    <Card className="w-80 min-w-80 min-h-[280px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Sparkline 
              data={getForecastSparklineData()}
              width={60}
              height={24}
              strokeWidth={1}
              showEndDot={true}
              strokeColor={getSparklineColor(overallStatus, analysisId, analysisIndex)}
              fillColor={getSparklineColor(overallStatus, analysisId, analysisIndex)}
              showValue={false}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          {viewMode === 'scenarios' && scenario && (
            <div key="scenarios" className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {scenario.summary || 'No scenario summary available'}
              </div>
            </div>
          )}
          
          {viewMode === 'scenarios' && !scenario && (
            <div key="scenarios-loading" className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Loading scenario data...
              </div>
            </div>
          )}
          
          {viewMode === 'regions' && regions && (
            <div key="regions" className="space-y-2">
              {regions.map((region) => (
                <div key={region.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="text-muted-foreground truncate" title={region.name}>
                        {region.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">{region.cumulativeImpact.toFixed(1)}%</span>
                  </div>
                  <AnimatedProgress 
                    value={region.cumulativeImpact} 
                    className="h-1.5 [&>div]:bg-sibvi-cyan-700"
                  />
                </div>
              ))}
            </div>
          )}
          
          {viewMode === 'categories' && categories && (
            <div key="categories" className="space-y-2">
              {categories
                .filter(category => category.driverCount > 0) // Filter out empty categories
                .map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className="text-muted-foreground truncate" title={category.name}>
                          {category.name}
                        </span>
                        {/* Badges are now hidden */}
                      </div>
                      <span className="text-muted-foreground flex-shrink-0">{category.importance}%</span>
                    </div>
                    <AnimatedProgress 
                      value={category.importance} 
                      className="h-1.5 [&>div]:bg-sibvi-cyan-700"
                    />
                  </div>
                ))}
            </div>
          )}
          
          {viewMode === 'predictors' && drivers && (
            <div key="predictors" className="space-y-2">
              {drivers.map((driver) => (
                <div key={driver.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="text-muted-foreground truncate" title={driver.name}>
                        {driver.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">{driver.importance.toFixed(1)}%</span>
                  </div>
                  <AnimatedProgress 
                    value={driver.importance} 
                    className="h-1.5 [&>div]:bg-sibvi-cyan-700"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DriversComparison() {
  const { selectedDataset, loading: datasetLoading } = useDataset()
  const isMobile = useIsMobile()
  const [analysisFolders, setAnalysisFolders] = useState<AnalysisFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [analysisCategories, setAnalysisCategories] = useState<Record<string, Category[]>>({})
  const [allDatasetCategories, setAllDatasetCategories] = useState<Array<{ id: number; name: string }>>([])
  const [analysisForecasts, setAnalysisForecasts] = useState<Record<string, number[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('categories')
  const [analysisScenarios, setAnalysisScenarios] = useState<Record<string, Scenario>>({})
  const [analysisRegions, setAnalysisRegions] = useState<Record<string, Region[]>>({})
  const [analysisDrivers, setAnalysisDrivers] = useState<Record<string, Driver[]>>({})

  const fetchDriversReport = async (datasetTitle: string, analysisId: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/drivers-report`)
      if (response.ok) {
        const data = await response.json()
        return data.categories || []
      }
    } catch (error) {
      console.error(`Error fetching drivers report for ${analysisId}:`, error)
    }
    return []
  }

  const fetchAllDatasetCategories = async (datasetTitle: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/categories`)
      if (response.ok) {
        const data = await response.json()
        return data.categories || []
      }
    } catch (error) {
      console.error(`Error fetching all dataset categories:`, error)
    }
    return []
  }

  const fetchForecastData = async (datasetTitle: string, analysisId: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/forecast`)
      if (response.ok) {
        const data = await response.json()
        return data.forecastValues || []
      }
    } catch (error) {
      console.error(`Error fetching forecast data for ${analysisId}:`, error)
    }
    return []
  }

  const fetchScenarioData = async (datasetTitle: string, analysisId: string) => {
    try {
      const url = `/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/scenario`
      console.log(`Fetching scenario data from: ${url}`)
      
      const response = await fetch(url)
      console.log(`Response status for ${analysisId}:`, response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Scenario data for ${analysisId}:`, data)
        const result = { summary: data.Summary || '' }
        console.log(`Processed scenario result for ${analysisId}:`, result)
        return result
      } else {
        console.error(`Failed to fetch scenario data for ${analysisId}:`, response.status, response.statusText)
        const errorText = await response.text()
        console.error(`Error response body:`, errorText)
      }
    } catch (error) {
      console.error(`Error fetching scenario data for ${analysisId}:`, error)
    }
    return { summary: '' }
  }

  const fetchRegionData = async (datasetTitle: string, analysisId: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/drivers-report`)
      if (response.ok) {
        const data = await response.json()
        const driversReport = data.driversReport || data
        
        // Extract regions and calculate cumulative impact
        const regionMap = new Map<number, { name: string; parent_id: number | null; impact: number }>()
        
        if (driversReport && typeof driversReport === 'object') {
          Object.values(driversReport).forEach((driver: any) => {
            if (driver && driver.region && Array.isArray(driver.region)) {
              driver.region.forEach((region: any) => {
                if (region && typeof region.id === 'number' && typeof region.name === 'string') {
                  const existing = regionMap.get(region.id)
                  const importance = driver.importance?.overall?.mean || 0
                  
                  if (existing) {
                    existing.impact += importance
                  } else {
                    regionMap.set(region.id, {
                      name: region.name,
                      parent_id: region.parent_id,
                      impact: importance
                    })
                  }
                }
              })
            }
          })
        }
        
        // Convert to array and sort by cumulative impact
        return Array.from(regionMap.entries())
          .map(([id, data]) => ({
            id,
            name: data.name,
            parent_id: data.parent_id,
            cumulativeImpact: data.impact
          }))
          .sort((a, b) => b.cumulativeImpact - a.cumulativeImpact)
      }
    } catch (error) {
      console.error(`Error fetching region data for ${analysisId}:`, error)
    }
    return []
  }

  const fetchDriverData = async (datasetTitle: string, analysisId: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/drivers-report`)
      if (response.ok) {
        const data = await response.json()
        const driversReport = data.driversReport || data
        
        const drivers: Driver[] = []
        
        if (driversReport && typeof driversReport === 'object') {
          Object.entries(driversReport).forEach(([driverId, driver]: [string, any]) => {
            if (driver && driver.importance?.overall?.mean) {
              drivers.push({
                id: driverId,
                name: driver.driver_name || driverId, // Use driver_name if available, fallback to ID
                importance: driver.importance.overall.mean,
                category: driver.category
              })
            }
          })
        }
        
        // Sort by importance
        return drivers.sort((a, b) => b.importance - a.importance)
      }
    } catch (error) {
      console.error(`Error fetching driver data for ${analysisId}:`, error)
    }
    return []
  }

  // New function to count drivers per category from the drivers report
  const countDriversPerCategory = async (datasetTitle: string, analysisId: string) => {
    try {
      const response = await fetch(`/api/data-folders/${encodeURIComponent(datasetTitle)}/analyses/${analysisId}/drivers-report`)
      if (response.ok) {
        const data = await response.json()
        const driversReport = data.driversReport || data
        
        // Count drivers per category
        const categoryCounts = new Map<number, number>()
        
        if (driversReport && typeof driversReport === 'object') {
          Object.values(driversReport).forEach((driver: any) => {
            if (driver && driver.category) {
              let categoryId: number | null = null
              
              // Handle different category data structures
              if (typeof driver.category === 'object' && driver.category !== null) {
                if (driver.category.id !== undefined) {
                  categoryId = driver.category.id
                } else if (Array.isArray(driver.category) && driver.category.length > 0) {
                  // If category is an array, take the first item
                  const firstCategory = driver.category[0]
                  if (typeof firstCategory === 'object' && firstCategory.id !== undefined) {
                    categoryId = firstCategory.id
                  } else if (typeof firstCategory === 'number') {
                    categoryId = firstCategory
                  }
                }
              } else if (typeof driver.category === 'number') {
                categoryId = driver.category
              }
              
              if (categoryId !== null && !isNaN(categoryId)) {
                categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1)
              }
            }
          })
        }
        
        return categoryCounts
      }
    } catch (error) {
      console.error(`Error counting drivers per category for ${analysisId}:`, error)
    }
    return new Map<number, number>()
  }

  useEffect(() => {
    const fetchAnalysisFolders = async () => {
      if (!selectedDataset) {
        setAnalysisFolders([])
        setAnalysisCategories({})
        setAllDatasetCategories([])
        setAnalysisForecasts({})
        setAnalysisScenarios({})
        setAnalysisRegions({})
        setAnalysisDrivers({})
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
        if (response.ok) {
          const folders = await response.json()
          setAnalysisFolders(folders)
          
          // Fetch all dataset categories first
          const allCategories = await fetchAllDatasetCategories(selectedDataset.title)
          setAllDatasetCategories(allCategories)
          
          // Fetch all data for each analysis
          const categories: Record<string, Category[]> = {}
          const forecasts: Record<string, number[]> = {}
          const scenarios: Record<string, Scenario> = {}
          const regions: Record<string, Region[]> = {}
          const drivers: Record<string, Driver[]> = {}
          
          const promises = folders.map(async (folder: AnalysisFolder, index: number) => {
            const [driversCategories, forecastData, driverCounts, scenarioData, regionData, driverData] = await Promise.all([
              fetchDriversReport(selectedDataset.title, folder.id),
              fetchForecastData(selectedDataset.title, folder.id),
              countDriversPerCategory(selectedDataset.title, folder.id),
              fetchScenarioData(selectedDataset.title, folder.id),
              fetchRegionData(selectedDataset.title, folder.id),
              fetchDriverData(selectedDataset.title, folder.id)
            ])
            return { id: folder.id, driversCategories, forecastData, driverCounts, scenarioData, regionData, driverData, index }
          })
          
          const results = await Promise.all(promises)
          results.forEach(({ id, driversCategories, forecastData, driverCounts, scenarioData, regionData, driverData, index }) => {
            // Merge categories with driver counts
            const categoriesWithCounts = driversCategories.map((cat: any) => ({
              ...cat,
              driverCount: driverCounts.get(cat.id) || 0
            }))
            
            console.log(`Analysis ${id}:`, {
              categories: categoriesWithCounts,
              driverCounts: Object.fromEntries(driverCounts),
              totalDrivers: Array.from(driverCounts.values()).reduce((sum: any, count: any) => sum + count, 0),
              scenario: scenarioData,
              regions: regionData,
              drivers: driverData
            })
            
            // Debug scenario data specifically
            if (viewMode === 'scenarios') {
              console.log(`Scenario data for ${id}:`, scenarioData)
            }
            
            categories[id] = categoriesWithCounts
            forecasts[id] = forecastData
            scenarios[id] = scenarioData
            regions[id] = regionData
            drivers[id] = driverData
            
            // Debug scenario data being set
            console.log(`Setting scenario data for ${id}:`, scenarioData)
          })
          
          setAnalysisCategories(categories)
          setAnalysisForecasts(forecasts)
          setAnalysisScenarios(scenarios)
          setAnalysisRegions(regions)
          setAnalysisDrivers(drivers)
        } else {
          setAnalysisFolders([])
          setAnalysisCategories({})
        }
      } catch (error) {
        console.error('Error fetching analysis folders:', error)
        setAnalysisFolders([])
        setAnalysisCategories({})
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysisFolders()
  }, [selectedDataset])

  // Generate mock data for each analysis folder
  const generateMockData = (index: number) => {
    const statuses: Array<"on-track" | "at-risk" | "behind"> = ["on-track", "at-risk", "behind"]
    const trends: Array<"up" | "down" | "stable"> = ["up", "down", "stable"]
    
    return {
      overallStatus: statuses[index % statuses.length] as "on-track" | "at-risk" | "behind",
      trend: trends[index % statuses.length] as "up" | "down" | "stable"
    }
  }

  // Merge all dataset categories with analysis-specific data
  const getMergedCategories = (analysisId: string): Category[] => {
    if (allDatasetCategories.length === 0) return []
    
    const analysisSpecificCategories = analysisCategories[analysisId] || []
    
    // Create a map of analysis-specific categories for quick lookup
    const analysisCategoriesMap = new Map(
      analysisSpecificCategories.map(cat => [cat.id, { importance: cat.importance, driverCount: cat.driverCount }])
    )
    
    // Return all dataset categories with real values or 0 for missing ones
    return allDatasetCategories.map(category => {
      const analysisData = analysisCategoriesMap.get(category.id)
      return {
        id: category.id,
        name: category.name,
        importance: analysisData?.importance || 0,
        driverCount: analysisData?.driverCount || 0
      }
    })
  }

  // Show loading state while datasets are being loaded from the context
  if (datasetLoading) {
    return (
      <div className="">
        {/* Toggle Group Header Skeleton */}
        <div className="px-4 lg:px-6 mb-4">
          <div className="flex items-center">
            <div className="hidden md:flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
            <Skeleton className="h-9 w-40 md:hidden" />
          </div>
        </div>
        
        {/* Driver Cards Skeleton */}
        <div className="flex gap-4 px-4 lg:px-6 overflow-x-auto pb-4 pr-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="w-80 min-w-80 min-h-[280px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-15 h-6 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  {/* Content skeleton based on view mode */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* New Analysis Card Skeleton */}
          <div className="w-80 min-w-80 min-h-[280px] flex flex-col border border-dashed rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="w-12 h-12 rounded-full mb-3 mx-auto" />
              <Skeleton className="h-5 w-24 mb-1 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedDataset) {
    return (
      <div className="">
        {/* Toggle Group Header */}
        <div className="px-4 lg:px-6 mb-4">
          <div className="flex items-center">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              variant="outline"
              disabled={true}
              className="hidden md:flex"
            >
              <ToggleGroupItem value="scenarios" disabled={true} className="px-3 py-2">Scenarios</ToggleGroupItem>
              <ToggleGroupItem value="regions" disabled={true} className="px-3 py-2">Regions</ToggleGroupItem>
              <ToggleGroupItem value="categories" disabled={true} className="px-3 py-2">Categories</ToggleGroupItem>
              <ToggleGroupItem value="predictors" disabled={true} className="px-3 py-2">Predictors</ToggleGroupItem>
            </ToggleGroup>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} disabled={true}>
              <SelectTrigger
                className="flex w-40 md:hidden"
                size="sm"
                aria-label="Select view mode"
                disabled={true}
              >
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="scenarios" className="rounded-lg">
                  Scenarios
                </SelectItem>
                <SelectItem value="regions" className="rounded-lg">
                  Regions
                </SelectItem>
                <SelectItem value="categories" className="rounded-lg">
                  Categories
                </SelectItem>
                <SelectItem value="predictors" className="rounded-lg">
                  Predictors
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="px-4 lg:px-6">
          <p className="text-muted-foreground">
            Select a dataset from the sidebar to view analysis comparisons.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="">
        {/* Toggle Group Header Skeleton */}
        <div className="px-4 lg:px-6 mb-4">
          <div className="flex items-center">
            <div className="hidden md:flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
            <Skeleton className="h-9 w-40 md:hidden" />
          </div>
        </div>
        
        {/* Driver Cards Skeleton */}
        <div className="flex gap-4 px-4 lg:px-6 overflow-x-auto pb-4 pr-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="w-80 min-w-80 min-h-[280px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-15 h-6 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  {/* Content skeleton based on view mode */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* New Analysis Card Skeleton */}
          <div className="w-80 min-w-80 min-h-[280px] flex flex-col border border-dashed rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="w-12 h-12 rounded-full mb-3 mx-auto" />
              <Skeleton className="h-5 w-24 mb-1 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      {analysisFolders.length === 0 ? (
        <div className="px-4 lg:px-6">
          <p className="text-muted-foreground">
            No analysis folders found for {selectedDataset.title}.
          </p>
        </div>
      ) : (
        <>
          {/* Toggle Group Header */}
          <div className="px-4 lg:px-6 mb-4">
            <div className="flex items-center">
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as ViewMode)}
                variant="outline"
                className="hidden md:flex"
              >
                <ToggleGroupItem value="scenarios" className="px-3 py-2">Scenarios</ToggleGroupItem>
                <ToggleGroupItem value="regions" className="px-3 py-2">Regions</ToggleGroupItem>
                <ToggleGroupItem value="categories" className="px-3 py-2">Categories</ToggleGroupItem>
                <ToggleGroupItem value="predictors" className="px-3 py-2">Predictors</ToggleGroupItem>
              </ToggleGroup>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger
                  className="flex w-40 md:hidden"
                  size="sm"
                  aria-label="Select view mode"
                >
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="scenarios" className="rounded-lg">
                    Scenarios
                  </SelectItem>
                  <SelectItem value="regions" className="rounded-lg">
                    Regions
                  </SelectItem>
                  <SelectItem value="categories" className="rounded-lg">
                    Categories
                  </SelectItem>
                  <SelectItem value="predictors" className="rounded-lg">
                    Predictors
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4 px-4 lg:px-6 overflow-x-auto pb-4 pr-8">
            {analysisFolders.map((folder, index) => {
              const mockData = generateMockData(index)
              // Get merged categories (all dataset categories with real values or 0 for missing ones)
              const categories = getMergedCategories(folder.id)
              
              return (
                <div
                  key={folder.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <DriverCard
                    title={folder.name}
                    description={`${categories.reduce((total, cat) => total + cat.driverCount, 0)} total drivers`}
                    categories={viewMode === 'categories' ? categories : undefined}
                    regions={viewMode === 'regions' ? analysisRegions[folder.id] : undefined}
                    drivers={viewMode === 'predictors' ? analysisDrivers[folder.id] : undefined}
                    scenario={viewMode === 'scenarios' ? (() => {
                      const scenario = analysisScenarios[folder.id]
                      console.log(`Rendering scenario for ${folder.id}:`, scenario)
                      return scenario
                    })() : undefined}
                    overallStatus={mockData.overallStatus}
                    trend={mockData.trend}
                    analysisId={folder.id}
                    forecastData={analysisForecasts[folder.id] || []}
                    analysisIndex={index}
                    viewMode={viewMode}
                  />
                </div>
              )
            })}
            
            {/* New Analysis Card */}
            <div 
              className="w-80 min-w-80 min-h-[280px] flex flex-col border border-dashed rounded-lg p-6 flex items-center justify-center cursor-pointer animate-in fade-in-0 slide-in-from-bottom-4 duration-500 hover:bg-muted/50 transition-colors"
              style={{ animationDelay: `${analysisFolders.length * 100}ms` }}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">New Analysis</h3>
                <p className="text-sm text-muted-foreground mt-1">Create a new analysis</p>
              </div>
            </div>
          </div>
          

        </>
      )}
    </div>
  )
}