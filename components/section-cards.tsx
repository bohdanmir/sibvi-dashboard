"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useDataset } from "@/lib/dataset-context"

import { Badge } from "@/components/ui/badge"

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
      <div className="@container/card rounded-lg px-0 py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Dataset</div>
            <div className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
              {selectedDataset.title}
            </div>
          </div>
          <Badge variant="outline">
            {selectedDataset.description?.unit || '--'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-5">
          {selectedDataset.description?.description || 'Dataset information not available'}
        </div>
      </div>
      <div className="@container/card rounded-lg px-0 py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Data Characteristics</div>
            <div className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
              {selectedDataset.description?.dataCharacteristics?.seasonalitySummary || '--'}
            </div>
          </div>
          <Badge variant="outline">
            {selectedDataset.description?.dataType || '--'}
          </Badge>
        </div>
        <div className="space-y-1 text-sm">
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
      </div>
      <div className="@container/card rounded-lg px-0 py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Business Implications</div>
            <div className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
              Applications
            </div>
          </div>
          <Badge variant="outline">
            {selectedDataset.description?.implications?.length || 0} areas
          </Badge>
        </div>
        <div className="space-y-1 text-sm">
          {selectedDataset.description?.implications?.slice(0, 4).map((implication, index) => (
            <div key={index} className="font-medium text-muted-foreground">
              {implication}
            </div>
          ))}
        </div>
      </div>
      <div className="@container/card rounded-lg px-0 py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Highs/Lows</div>
            <div className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
              Critical Events
            </div>
          </div>
          <Badge variant="outline">
            Peak & Valley
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
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
      </div>
    </div>
  )
}
