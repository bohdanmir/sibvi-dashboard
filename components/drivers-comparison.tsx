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

interface DriverCardProps {
  title: string
  description: string
  progress: number
  currentValue: string
  targetValue: string
  status: "on-track" | "at-risk" | "behind"
  trend: "up" | "down" | "stable"
}

function DriverCard({ title, description, progress, currentValue, targetValue, status, trend }: DriverCardProps) {
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
          </div>
          <div className={`text-sm font-medium ${getStatusColor(status)}`}>
            {status.replace("-", " ").toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Current: {currentValue}</span>
            <span>Target: {targetValue}</span>
          </div>
        </div>
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

  useEffect(() => {
    const fetchAnalysisFolders = async () => {
      if (!selectedDataset) {
        setAnalysisFolders([])
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/data-folders/${encodeURIComponent(selectedDataset.title)}/analyses`)
        if (response.ok) {
          const folders = await response.json()
          setAnalysisFolders(folders)
        } else {
          setAnalysisFolders([])
        }
      } catch (error) {
        console.error('Error fetching analysis folders:', error)
        setAnalysisFolders([])
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
      progress: Math.floor(Math.random() * 60) + 40, // 40-100
      currentValue: `${(Math.random() * 5 + 3).toFixed(1)}M`,
      targetValue: "10M",
      status: statuses[index % statuses.length] as "on-track" | "at-risk" | "behind",
      trend: trends[index % trends.length] as "up" | "down" | "stable"
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
            return (
              <DriverCard
                key={folder.id}
                title={folder.name}
                description={`Analysis folder: ${folder.id}`}
                {...mockData}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
