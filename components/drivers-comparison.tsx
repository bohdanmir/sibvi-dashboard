"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkline } from "@/components/ui/sparkline"
import { Badge } from "@/components/ui/badge"
import { useDataset } from "@/lib/dataset-context"
import { Button } from "@/components/ui/button"
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react"

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

interface DriverCardProps {
  title: string
  description: string
  categories: Category[]
  overallStatus: "on-track" | "at-risk" | "behind"
  trend: "up" | "down" | "stable"
  analysisId: string
  forecastData: number[]
  analysisIndex: number
  isExpanded: boolean
}

function DriverCard({ title, description, categories, overallStatus, trend, analysisId, forecastData, analysisIndex, isExpanded }: DriverCardProps) {
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
              strokeColor={getSparklineColor(overallStatus, analysisId, analysisIndex)}
              fillColor={getSparklineColor(overallStatus, analysisId, analysisIndex)}
              showValue={false}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">

        
        <div className="flex-1 space-y-4">
          {isExpanded ? (
            categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-muted-foreground truncate" title={category.name}>
                      {category.name}
                    </span>
                    {/* Add badge showing number of drivers */}
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-1.5 py-0.5 flex-shrink-0 ${
                        category.driverCount > 0 
                          ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {category.driverCount} driver{category.driverCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground flex-shrink-0">{category.importance}%</span>
                </div>
                <Progress value={category.importance} className="h-1.5" />
              </div>
            ))
          ) : (
            categories
              .sort((a, b) => b.importance - a.importance) // Sort by importance descending
              .slice(0, 3) // Take top 3
              .map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-muted-foreground truncate" title={category.name}>
                        {category.name}
                      </span>
                      {/* Add badge showing number of drivers */}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-1.5 py-0.5 flex-shrink-0 ${
                          category.driverCount > 0 
                            ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30' 
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {category.driverCount} driver{category.driverCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">{category.importance}%</span>
                  </div>
                  <Progress value={category.importance} className="h-1.5" />
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DriversComparison() {
  const { selectedDataset } = useDataset()
  const [analysisFolders, setAnalysisFolders] = useState<AnalysisFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [analysisCategories, setAnalysisCategories] = useState<Record<string, Category[]>>({})
  const [allDatasetCategories, setAllDatasetCategories] = useState<Array<{ id: number; name: string }>>([])
  const [analysisForecasts, setAnalysisForecasts] = useState<Record<string, number[]>>({})
  const [isExpanded, setIsExpanded] = useState(false)

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
          
          // Fetch drivers report, forecast data, and driver counts for each analysis
          const categories: Record<string, Category[]> = {}
          const forecasts: Record<string, number[]> = {}
          
          const promises = folders.map(async (folder: AnalysisFolder, index: number) => {
            const [driversCategories, forecastData, driverCounts] = await Promise.all([
              fetchDriversReport(selectedDataset.title, folder.id),
              fetchForecastData(selectedDataset.title, folder.id),
              countDriversPerCategory(selectedDataset.title, folder.id)
            ])
            return { id: folder.id, driversCategories, forecastData, driverCounts, index }
          })
          
          const results = await Promise.all(promises)
          results.forEach(({ id, driversCategories, forecastData, driverCounts, index }) => {
            // Merge categories with driver counts
            const categoriesWithCounts = driversCategories.map((cat: any) => ({
              ...cat,
              driverCount: driverCounts.get(cat.id) || 0
            }))
            
            console.log(`Analysis ${id}:`, {
              categories: categoriesWithCounts,
              driverCounts: Object.fromEntries(driverCounts),
              totalDrivers: Array.from(driverCounts.values()).reduce((sum: any, count: any) => sum + count, 0)
            })
            
            categories[id] = categoriesWithCounts
            forecasts[id] = forecastData
          })
          
          setAnalysisCategories(categories)
          setAnalysisForecasts(forecasts)
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

  if (!selectedDataset) {
    return (
      <div className="">
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
        <div className="px-4 lg:px-6">
          <p className="text-muted-foreground">
            Loading analysis folders for {selectedDataset.title}...
          </p>
        </div>
        <div className="px-4 lg:px-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-80 h-48 bg-muted/50 dark:bg-muted/30 animate-pulse rounded-lg border border-border/50"></div>
            ))}
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
          <div className="flex gap-4 px-4 lg:px-6 overflow-x-auto pb-4 pr-8">
            {analysisFolders.map((folder, index) => {
              const mockData = generateMockData(index)
              // Get merged categories (all dataset categories with real values or 0 for missing ones)
              const categories = getMergedCategories(folder.id)
              
              return (
                <DriverCard
                  key={folder.id}
                  title={folder.name}
                  description={`${categories.reduce((total, cat) => total + cat.driverCount, 0)} total drivers`}
                  categories={categories}
                  overallStatus={mockData.overallStatus}
                  trend={mockData.trend}
                  analysisId={folder.id}
                  forecastData={analysisForecasts[folder.id] || []}
                  analysisIndex={index}
                  isExpanded={isExpanded}
                />
              )
            })}
          </div>
          
          {/* Expand/Collapse Button - Centered below cards */}
          <div className="flex justify-center px-4 lg:px-6 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  <IconChevronUp className="h-4 w-4" />
                  Show Top 3 Drivers
                </>
              ) : (
                <>
                  <IconChevronDown className="h-4 w-4" />
                  Show All Drivers
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}