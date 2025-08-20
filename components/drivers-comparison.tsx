"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
}

function DriverCard({ title, description, categories, overallStatus, trend }: DriverCardProps) {
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

  // Generate mock progress data for each category (in real implementation, this would come from the API)
  const generateProgressData = () => {
    const currentValue = `${(Math.random() * 5 + 3).toFixed(1)}M`
    return {
      currentValue,
      targetValue: "10M"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
          </div>
          <div className={`text-sm font-medium ${getStatusColor(overallStatus)}`}>
            {overallStatus.replace("-", " ").toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const progressData = generateProgressData()
          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.name}</span>
                <span className="font-medium">{category.importance}%</span>
              </div>
              <Progress value={category.importance} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Current: {progressData.currentValue}</span>
                <span>Target: {progressData.targetValue}</span>
              </div>
            </div>
          )
        })}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trend</span>
          <span className="font-medium">{getTrendIcon(trend)} {trend}</span>
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

  useEffect(() => {
    const fetchAnalysisFolders = async () => {
      if (!selectedDataset) {
        setAnalysisFolders([])
        setAnalysisCategories({})
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
        if (response.ok) {
          const folders = await response.json()
          setAnalysisFolders(folders)
          
          // Fetch drivers report for each analysis
          const categories: Record<string, Category[]> = {}
          
          const promises = folders.map(async (folder: AnalysisFolder) => {
            const driversCategories = await fetchDriversReport(selectedDataset.title, folder.id)
            return { id: folder.id, driversCategories }
          })
          
          const results = await Promise.all(promises)
          results.forEach(({ id, driversCategories }) => {
            categories[id] = driversCategories
          })
          
          setAnalysisCategories(categories)
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
    
    // Generate mock categories for each card
    const categoryOptions = ["Population", "Wholesale and retail trade", "Manufacturing", "Construction", "Transportation", "Healthcare", "Education", "Finance"]
    const numCategories = Math.floor(Math.random() * 5) + 2 // 2-6 categories
    const categories = Array.from({ length: numCategories }, (_, itemIndex) => ({
      id: itemIndex + 1,
      name: categoryOptions[itemIndex % categoryOptions.length],
      importance: Math.floor(Math.random() * 60) + 40 // 40-100 for mock data
    }))
    
    return {
      categories,
      overallStatus: statuses[index % statuses.length] as "on-track" | "at-risk" | "behind",
      trend: trends[index % statuses.length] as "up" | "down" | "stable"
    }
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
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Drivers Comparison</h2>
        <p className="text-muted-foreground">
          Analysis folders for {selectedDataset.title} dataset.
        </p>
      </div>
      {analysisFolders.length === 0 ? (
        <div className="px-4 lg:px-6">
          <p className="text-muted-foreground">
            No analysis folders found for {selectedDataset.title}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 lg:px-6">
          {analysisFolders.map((folder, index) => {
            const mockData = generateMockData(index)
            // Use real categories if available, otherwise fall back to mock data
            const categories = analysisCategories[folder.id]?.length > 0 
              ? analysisCategories[folder.id] 
              : mockData.categories
            
            return (
              <DriverCard
                key={folder.id}
                title={folder.name}
                description={`Analysis folder: ${folder.id}`}
                categories={categories}
                overallStatus={mockData.overallStatus}
                trend={mockData.trend}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}