"use client"


import { useDataset } from "@/lib/dataset-context"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LinkPreview } from "@/components/link-preview"

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
}

export function SectionCards({ selectedMonth, showFutureOutlook = true }: SectionCardsProps) {
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

  // Determine what content to show based on selected month
  const getContentData = () => {
    if (!newsData) return null
    
    if (selectedMonth && newsData[selectedMonth]) {
      return {
        title: selectedMonth,
        summary: newsData[selectedMonth].summary || "Monthly summary not available",
        news: newsData[selectedMonth].news || [],
        type: "monthly"
      }
    } else if (showFutureOutlook && newsData["Future Outlook"]) {
      return {
        title: "Future Outlook",
        summary: newsData["Future Outlook"].summary || "Future outlook summary not available",
        news: newsData["Future Outlook"].news || [],
        type: "outlook"
      }
    }
    
    return null
  }

  const contentData = getContentData()

  return (
    <div className="px-4 lg:px-6">
      {loading || !contentData ? (
        <div className="text-center py-8 text-muted-foreground">
          {loading ? "Loading industry news..." : "No content available"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {/* Summary Card - First Card */}
          <div className="@container/card rounded-lg px-0 py-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-lg font-mono font-normal tabular-nums @[250px]/card:text-xl">
                {contentData.title}
              </div>
              <div className="flex gap-2">
                <Badge variant="default">
                  {contentData.type === "monthly" ? "News" : "Outlook"}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-4">
              {contentData.summary}
            </div>
          </div>
          
          {/* News Cards */}
          {contentData.news.length > 0 ? contentData.news.map((news, index) => (
            <Card key={`${contentData.type}-${index}`} className="overflow-hidden">
              <CardContent>
                <div className="flex items-center space-x-2 mb-3">
                  {news.favicon && news.favicon.trim() !== "" ? (
                    <img 
                      src={news.favicon} 
                      alt={news.outlet}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        // Hide the broken image and show fallback
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-4 h-4 flex items-center justify-center"
                    style={{ display: news.favicon && news.favicon.trim() !== "" ? 'none' : 'flex' }}
                  >
                    <span className="text-xs text-muted-foreground">{news.outlet.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                    {news.outlet}
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-2">
                    <a 
                      href={news.link} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-normal text-primary hover:text-primary/80 transition-colors line-clamp-3 leading-tight"
                    >
                      {news.title}
                    </a>
                    <div className="text-xs text-muted-foreground font-normal">
                      {news.date}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <LinkPreview 
                      url={news.link} 
                      fallbackTitle={news.title}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-4 text-muted-foreground">
              No news available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
