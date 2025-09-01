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
  }
}

interface SectionCardsProps {
  selectedMonth?: string // Format: "January 2024", "February 2024", etc.
  showFutureOutlook?: boolean // Default to true
}

export function SectionCards({ selectedMonth, showFutureOutlook = true }: SectionCardsProps) {
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

  // Get news based on selected month or default to future outlook
  let displayContent: React.ReactNode | null = null
  let contentTitle = ""
  let contentSummary = ""

  if (showFutureOutlook && newsData?.futureOutlook) {
    // Display Future Outlook
    const outlook = newsData.futureOutlook
    contentTitle = `Future Outlook: ${outlook.month}`
    contentSummary = outlook.summary
    
    displayContent = (
      <>
        {outlook.news?.map((news) => (
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
        )) || []}
      </>
    )
  } else if (selectedMonth && newsData?.monthlySummaries) {
    // Display Monthly News
    const monthlyData = newsData.monthlySummaries.find(
      summary => summary.month === selectedMonth
    )
    
    if (monthlyData) {
      contentTitle = `${monthlyData.month} Summary`
      contentSummary = monthlyData.summary
      
      displayContent = (
        <>
          {monthlyData.news?.map((news) => (
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
          )) || []}
        </>
      )
    }
  }

    return (
      <div className="px-4 lg:px-6">
        {/* News Content - dynamically loaded from news.json */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading industry news...
          </div>
        ) : displayContent ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Summary Card - First Card */}
            <div className="@container/card rounded-lg px-0 py-6">
              <div className="flex items-start justify-between mb-3">
                <div className="text-lg font-mono font-normal tabular-nums @[250px]/card:text-xl">
                  {contentTitle || "Future Outlook"}
                </div>
                <Badge variant="default">
                  {showFutureOutlook ? "Outlook" : selectedMonth ? "News" : "Outlook"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-5">
                {contentSummary || "Industry insights and market analysis not available"}
              </div>
            </div>
            
            {/* News Cards */}
            {displayContent}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedMonth ? `No news available for ${selectedMonth}` : 'No future outlook available'}
          </div>
        )}
      </div>
  )
}
