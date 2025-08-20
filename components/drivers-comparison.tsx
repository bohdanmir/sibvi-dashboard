"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkline } from "@/components/ui/sparkline"
import { useDataset } from "@/lib/dataset-context"

interface AnalysisFolder {
  id: string
  name: string
  path: string
}

interface Category {
  id: number
  name: string
  importance: number
}

interface DriverCardProps {
  title: string
  description: string
  categories: Category[]
  overallStatus: "on-track" | "at-risk" | "behind"
  trend: "up" | "down" | "stable"
  analysisId: string
  forecastData: number[]
}

function DriverCard({ title, description, categories, overallStatus, trend, analysisId, forecastData }: DriverCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600"
      case "at-risk":
        return "text-yellow-600"
      case "behind":
        return "text-red-600"
      default:
        return "text-gray-600"
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



  // Get sparkline colors based on status
  const getSparklineColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "hsl(var(--green-600))"
      case "at-risk":
        return "hsl(var(--yellow-600))"
      case "behind":
        return "hsl(var(--red-600))"
      default:
        return "hsl(var(--muted-foreground))"
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
    <Card className="w-full">
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
              strokeColor={getSparklineColor(overallStatus)}
              fillColor={getSparklineColor(overallStatus)}
              showValue={false}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate min-w-0 flex-1" title={category.name}>
                {category.name}
              </span>
              <span className="text-muted-foreground flex-shrink-0">{category.importance}%</span>
            </div>
            <Progress value={category.importance} className="h-1.5" />
          </div>
        ))}

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
          
          // Fetch drivers report and forecast data for each analysis
          const categories: Record<string, Category[]> = {}
          const forecasts: Record<string, number[]> = {}
          
          const promises = folders.map(async (folder: AnalysisFolder) => {
            const [driversCategories, forecastData] = await Promise.all([
              fetchDriversReport(selectedDataset.title, folder.id),
              fetchForecastData(selectedDataset.title, folder.id)
            ])
            return { id: folder.id, driversCategories, forecastData }
          })
          
          const results = await Promise.all(promises)
          results.forEach(({ id, driversCategories, forecastData }) => {
            categories[id] = driversCategories
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
      analysisSpecificCategories.map(cat => [cat.id, cat.importance])
    )
    
    // Return all dataset categories with real values or 0 for missing ones
    return allDatasetCategories.map(category => ({
      id: category.id,
      name: category.name,
      importance: analysisCategoriesMap.get(category.id) || 0
    }))
  }

  if (!selectedDataset) {
    return (
      <div className="space-y-4">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Drivers Comparison</h2>
          <p className="text-muted-foreground">
            Select a dataset from the sidebar to view analysis comparisons.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Drivers Comparison</h2>
          <p className="text-muted-foreground">
            Loading analysis folders for {selectedDataset.title}...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {analysisFolders.length === 0 ? (
        <div className="px-4 lg:px-6">
          <p className="text-muted-foreground">
            No analysis folders found for {selectedDataset.title}.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 px-4 lg:px-6 overflow-x-auto pb-4">
          {analysisFolders.map((folder, index) => {
            const mockData = generateMockData(index)
            // Get merged categories (all dataset categories with real values or 0 for missing ones)
            const categories = getMergedCategories(folder.id)
            
            return (
              <DriverCard
                key={folder.id}
                title={folder.name}
                description={`Analysis folder: ${folder.id}`}
                categories={categories}
                overallStatus={mockData.overallStatus}
                trend={mockData.trend}
                analysisId={folder.id}
                forecastData={analysisForecasts[folder.id] || []}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}