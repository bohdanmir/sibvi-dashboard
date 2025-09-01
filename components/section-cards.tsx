"use client"

import { IconTrendingDown, IconTrendingUp, IconDotsVertical } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useDataset } from "@/lib/dataset-context"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NewsData {
  lastUpdated: string
  coveragePeriod: string
  monthlySummaries: Array<{
    month: string
    summary: string
    keyEvents: string[]
    news: Array<{
      id: string
      outlet: string
      outletLogo: string
      title: string
      time: string
      image: string
    }>
  }>
  futureOutlook: {
    period: string
    summary: string
    keyTrends: string[]
    marketProjections: Record<string, string>
    risks: string[]
    opportunities: string[]
  }
}

export function SectionCards() {
  const { selectedDataset } = useDataset()
  const { theme } = useTheme()
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadNewsData = async () => {
      if (!selectedDataset) return
      
      setLoading(true)
      try {
        // Extract dataset name from the URL path
        const datasetName = selectedDataset.title
        const newsUrl = `/data/${encodeURIComponent(datasetName)}/news.json`
        
        const response = await fetch(newsUrl)
        if (response.ok) {
          const data = await response.json()
          setNewsData(data)
        } else {
          setNewsData(null)
        }
      } catch (error) {
        console.error('Error loading news data:', error)
        setNewsData(null)
      } finally {
        setLoading(false)
      }
    }

    loadNewsData()
  }, [selectedDataset])

  if (!selectedDataset) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center py-8 text-muted-foreground">
          Select a dataset from the sidebar to view summary information
        </div>
      </div>
    )
  }

  // Get recent news from the loaded news data
  const recentNews = newsData?.monthlySummaries?.[newsData.monthlySummaries.length - 1]?.news || []

  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <div className="@container/card rounded-lg px-0 py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="text-lg font-mono font-normal tabular-nums @[250px]/card:text-xl">
            {selectedDataset.title}
          </div>
          <Badge variant="default">
            {selectedDataset.description?.unit || '--'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-5">
          {selectedDataset.description?.description || 'Dataset information not available'}
        </div>
      </div>
      
      {/* News Cards - dynamically loaded from news.json */}
      {loading ? (
        <div className="@container/card rounded-lg px-0 py-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading industry news...
          </div>
        </div>
      ) : recentNews.length > 0 ? (
        recentNews.map((news) => (
          <Card key={news.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-muted">
                      <img 
                        src={news.outletLogo} 
                        alt={news.outlet}
                        className="w-4 h-4 object-contain"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground font-medium">
                    {news.outlet}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <IconDotsVertical className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex space-x-3">
                <div className="flex-1 space-y-2">
                  <a 
                    href="#" 
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors line-clamp-3 leading-tight"
                  >
                    {news.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    {news.time}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <img 
                    src={news.image} 
                    alt={news.title}
                    className="w-16 h-16 rounded-md object-cover bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="@container/card rounded-lg px-0 py-6">
          <div className="text-center py-8 text-muted-foreground">
            No industry news available for this dataset
          </div>
        </div>
      )}
    </div>
  )
}
