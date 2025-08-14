"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface DatasetDescription {
  title: string
  description: string
  category: string
  source: string
  dataType: string
  unit?: string
  location?: string
  application?: string
  currency?: string
  dataCharacteristics?: {
    seasonality: string
    seasonalitySummary: string
    volatility: string
    seasonalSpikes: string
    seasonalDips: string
  }
  implications?: string[]
  historicalEvents?: string[]
}

export interface Dataset {
  title: string
  url: string
  icon: any
  description?: DatasetDescription
}

interface DatasetContextType {
  selectedDataset: Dataset | null
  setSelectedDataset: (dataset: Dataset | null) => void
  availableDatasets: Dataset[]
  loading: boolean
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/data-folders')
        if (!response.ok) {
          throw new Error('Failed to fetch datasets')
        }
        
        const datasets = await response.json()
        setAvailableDatasets(datasets)
        
        // Set first dataset as default if available
        if (datasets.length > 0) {
          setSelectedDataset(datasets[0])
        }
      } catch (error) {
        console.error('Error loading datasets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDatasets()
  }, [])

  return (
    <DatasetContext.Provider value={{
      selectedDataset,
      setSelectedDataset,
      availableDatasets,
      loading
    }}>
      {children}
    </DatasetContext.Provider>
  )
}

export function useDataset() {
  const context = useContext(DatasetContext)
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider')
  }
  return context
}
