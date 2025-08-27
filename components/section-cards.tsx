"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useTheme } from "next-themes"
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
  const { theme } = useTheme()

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
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Dataset</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.title}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {selectedDataset.description?.unit || '--'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-5 text-left text-muted-foreground">
            {selectedDataset.description?.description || 'Dataset information not available'}
          </div>
          {/* <div className="text-muted-foreground">
            {selectedDataset.description?.source || 'Data source'}
          </div> */}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Characteristics</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            {selectedDataset.description?.dataCharacteristics?.seasonalitySummary || '--'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {selectedDataset.description?.dataType || '--'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="space-y-1 text-left w-full">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seasonality:</span>
              <span className="font-medium">{selectedDataset.description?.dataCharacteristics?.seasonality || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility:</span>
              <span className="font-medium">{selectedDataset.description?.dataCharacteristics?.volatility || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seasonal Spikes:</span>
              <span className="font-medium">{selectedDataset.description?.dataCharacteristics?.seasonalSpikes || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seasonal Dips:</span>
              <span className="font-medium">{selectedDataset.description?.dataCharacteristics?.seasonalDips || '--'}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Business Implications</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            Applications
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {selectedDataset.description?.implications?.length || 0} areas
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="space-y-1 text-left w-full">
            {selectedDataset.description?.implications?.slice(0, 4).map((implication, index) => (
              <div key={index} className="font-medium text-muted-foreground">
                {implication}
              </div>
            ))}
            {/* {selectedDataset.description?.implications && selectedDataset.description.implications.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{selectedDataset.description.implications.length - 4} more areas
              </div>
            )} */}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Highs/Lows</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
            Critical Events
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              Peak & Valley
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="space-y-2 text-left w-full">
            <div className="space-y-1">
              <div className="text-xs font-medium text-green-600 dark:text-green-400">All-time High: {selectedDataset.description?.dataCharacteristics?.allTimeHigh || '--'}</div>
              <div className="text-xs text-muted-foreground">
                {selectedDataset.description?.dataCharacteristics?.highDescription || 'Peak performance period'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-red-600 dark:text-red-400">All-time Low: {selectedDataset.description?.dataCharacteristics?.allTimeLow || '--'}</div>
              <div className="text-xs text-muted-foreground">
                {selectedDataset.description?.dataCharacteristics?.lowDescription || 'Lowest performance period'}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
