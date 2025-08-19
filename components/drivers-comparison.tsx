"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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
  const drivers = [
    {
      title: "Driver A",
      description: "Primary performance metric",
      progress: 85,
      currentValue: "8.5M",
      targetValue: "10M",
      status: "on-track" as const,
      trend: "up" as const,
    },
    {
      title: "Driver B", 
      description: "Secondary performance metric",
      progress: 62,
      currentValue: "6.2M",
      targetValue: "10M",
      status: "at-risk" as const,
      trend: "stable" as const,
    },
    {
      title: "Driver C",
      description: "Tertiary performance metric", 
      progress: 45,
      currentValue: "4.5M",
      targetValue: "10M",
      status: "behind" as const,
      trend: "down" as const,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Drivers Comparison</h2>
        <p className="text-muted-foreground">
          Monitor and compare key performance drivers across different metrics.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 lg:px-6">
        {drivers.map((driver, index) => (
          <DriverCard key={index} {...driver} />
        ))}
      </div>
    </div>
  )
}
