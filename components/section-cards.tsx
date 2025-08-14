"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useDataset } from "@/lib/dataset-context"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { selectedDataset } = useDataset()

  if (!selectedDataset) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center py-8 text-muted-foreground">
          Select a dataset from the sidebar to view summary information
        </div>
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-primary/5 *:data-[slot=card]:bg-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Dataset</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.title}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current selection
          </div>
          <div className="text-muted-foreground">
            Data source for analysis
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Points</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            --
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Loading...
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total records available <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Historical data points
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Date Range</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            --
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Loading...
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Data coverage period <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">From first to last record</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Type</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            Time Series
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              CSV
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Structured data format <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Period and Value columns</div>
        </CardFooter>
      </Card>
    </div>
  )
}
