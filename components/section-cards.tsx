"use client"

import { IconDotsVertical } from "@tabler/icons-react"
import { useDataset } from "@/lib/dataset-context"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NewsItem {
  favicon: string
  outlet: string
  title: string
  link: string
  date: string
  image: string
}

interface MonthData {
  summary: string
  news: NewsItem[]
}

interface NewsData {
  [month: string]: MonthData
}

interface SectionCardsProps {
  selectedMonth?: string // Format: "January 2025", "February 2025", etc.
  showFutureOutlook?: boolean // Default to true
  onResetPin?: () => void // Callback to reset pin selection
}

export function SectionCards({ selectedMonth, showFutureOutlook = true, onResetPin }: SectionCardsProps) {
  const { selectedDataset } = useDataset()
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
          console.log('Loaded news data:', data)
          setNewsData(data)
        } else {
          console.error('Failed to load news data:', response.status, response.statusText)
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

  // Debug: Log available months
  if (newsData) {
    console.log('Available months:', Object.keys(newsData))
    console.log('Selected month:', selectedMonth)
    console.log('Show future outlook:', showFutureOutlook)
    console.log('Has selected month data:', selectedMonth ? newsData[selectedMonth] : 'No selected month')
    console.log('Month data structure:', selectedMonth && newsData[selectedMonth] ? {
      hasSummary: !!newsData[selectedMonth].summary,
      hasNews: !!newsData[selectedMonth].news,
      newsCount: newsData[selectedMonth].news?.length || 0
    } : 'No month data')
  }

  if (selectedMonth && newsData?.[selectedMonth] && newsData[selectedMonth].news) {
    // Display Monthly News
    const monthlyData = newsData[selectedMonth]
    contentTitle = `${selectedMonth} Summary`
    contentSummary = monthlyData.summary || "Monthly summary not available"
    
    displayContent = (
      <>
        {monthlyData.news && monthlyData.news.length > 0 ? monthlyData.news.map((news, index) => (
          <Card key={`${selectedMonth}-${index}`} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-muted">
                      {news.favicon ? (
                        <img 
                          src={news.favicon} 
                          alt={news.outlet}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <span className="text-xs">{news.outlet.charAt(0)}</span>
                      )}
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
                    href={news.link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors line-clamp-3 leading-tight"
                  >
                    {news.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    {news.date}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {news.image ? (
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-16 h-16 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-4 text-muted-foreground">
            No news available for {selectedMonth}
          </div>
        )}
      </>
    )
  } else if (showFutureOutlook && newsData?.["Future Outlook"] && newsData["Future Outlook"].news) {
    // Display Future Outlook
    const outlook = newsData["Future Outlook"]
    contentTitle = "Future Outlook"
    contentSummary = outlook.summary || "Future outlook summary not available"
    
    displayContent = (
      <>
        {outlook.news && outlook.news.length > 0 ? outlook.news.map((news, index) => (
          <Card key={`outlook-${index}`} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-muted">
                      {news.favicon ? (
                        <img 
                          src={news.favicon} 
                          alt={news.outlet}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <span className="text-xs">{news.outlet.charAt(0)}</span>
                      )}
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
                    href={news.link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors line-clamp-3 leading-tight"
                  >
                    {news.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    {news.date}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {news.image ? (
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-16 h-16 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-4 text-muted-foreground">
            No future outlook news available
          </div>
        )}
      </>
    )
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
                <div className="flex gap-2">
                  <Badge variant="default">
                    {selectedMonth ? "News" : "Outlook"}
                  </Badge>
                  {selectedMonth && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        📌 Pinned
                      </Badge>
                                              <button
                          onClick={onResetPin}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title="Reset to Future Outlook"
                        >
                          ↺
                        </button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-5">
                {contentSummary || "Industry insights and market analysis not available"}
              </div>
              {selectedMonth && (
                <div className="text-xs text-muted-foreground mt-2">
                  📍 Showing news for {selectedMonth} (drag the pin on the chart to change)
                </div>
              )}
            </div>
            
            {/* News Cards */}
            {displayContent}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedMonth ? `No news available for ${selectedMonth}` : 'No future outlook available'}
            {newsData && (
              <div className="mt-2 text-xs">
                Available months: {Object.keys(newsData).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
  )
}
