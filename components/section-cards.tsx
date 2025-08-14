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
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Dataset</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.title}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {selectedDataset.description?.category || 'Data'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-2 text-left">
            {selectedDataset.description?.description || 'Dataset information not available'}
          </div>
          <div className="text-muted-foreground">
            {selectedDataset.description?.source || 'Data source'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Type</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.description?.dataType || 'Time Series'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {selectedDataset.description?.unit || 'CSV'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Data format <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {selectedDataset.description?.unit || 'Period and Value columns'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Application</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.description?.application?.split(',')[0] || 'Industrial'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {selectedDataset.description?.category || 'Data'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Primary use case <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {selectedDataset.description?.application || 'Industrial applications'}
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
    </div>
  )
}
