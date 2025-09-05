"use client"


import { useDataset } from "@/lib/dataset-context"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LinkPreview } from "@/components/link-preview"
import { Skeleton } from "@/components/ui/skeleton"

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
  const { selectedDataset, loading: datasetLoading } = useDataset()
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isMonthChanging, setIsMonthChanging] = useState(false)

  // Detect when selectedMonth changes and show skeleton immediately
  useEffect(() => {
    if (selectedMonth !== undefined) {
      setIsMonthChanging(true)
      setShowContent(false)
      // Reset the month changing state and show content after a short delay
      setTimeout(() => {
        setIsMonthChanging(false)
        setShowContent(true)
      }, 100)
    }
  }, [selectedMonth])

  useEffect(() => {
    const loadNewsData = async () => {
      if (!selectedDataset) {
        setShowContent(false)
        setNewsData(null)
        return
      }
      
      setLoading(true)
      setShowContent(false)
      setNewsData(null)
      try {
        // Extract dataset name from the URL path
        const datasetName = selectedDataset.title
        const newsUrl = `/data/${encodeURIComponent(datasetName)}/news.json`
        
        const response = await fetch(newsUrl)
        if (response.ok) {
          const data = await response.json()
          console.log('Loaded news data:', data)
          setNewsData(data)
          // Trigger fade-in animation after a short delay
          setTimeout(() => {
            setShowContent(true)
          }, 200)
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

  // Show skeleton when datasets are loading, when news data is loading, or when month is changing
  if (datasetLoading || loading || !showContent || isMonthChanging) {
    return (
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {/* Summary Card Skeleton */}
          <div className="@container/card rounded-lg px-0 py-6">
            <div className="flex items-start justify-between mb-1">
              <Skeleton className="h-6 w-32 @[250px]/card:h-7" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          {/* News Cards Skeleton */}
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="overflow-hidden min-h-[140px]">
              <CardContent className="pb-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-3 w-20" />
                </div>
                
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Skeleton className="w-16 h-16 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedDataset) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center py-8 text-muted-foreground">
          Select a dataset from the sidebar to view summary information
        </div>
      </div>
    )
  }

  // Convert short month format (e.g., "Apr 2024") to long format (e.g., "April 2024")
  const convertToLongMonthFormat = (shortMonth: string) => {
    const monthMap: { [key: string]: string } = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    }
    
    const parts = shortMonth.split(' ')
    if (parts.length === 2) {
      const [shortMonthName, year] = parts
      const longMonthName = monthMap[shortMonthName]
      if (longMonthName) {
        return `${longMonthName} ${year}`
      }
    }
    return shortMonth // Return original if conversion fails
  }

  // Determine what content to show based on selected month
  const getContentData = () => {
    if (!newsData) return null
    
    // Try both short and long month formats
    const longMonthFormat = convertToLongMonthFormat(selectedMonth || '')
    const monthKey = selectedMonth && newsData[selectedMonth] ? selectedMonth : longMonthFormat
    
    if (selectedMonth && newsData[monthKey]) {
      return {
        title: longMonthFormat, // Display in long format for consistency
        summary: newsData[monthKey].summary || "Monthly summary not available",
        news: newsData[monthKey].news || [],
        type: "monthly"
      }
    } else if (showFutureOutlook && newsData["Future Outlook"]) {
      return {
        title: "Q3/Q4 2025",
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
      {!contentData ? (
        <div className="text-center py-8 text-muted-foreground">
          No content available
        </div>
      ) : (
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Summary Card - First Card */}
          <div className="rounded-lg px-0 py-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-lg font-mono font-normal tabular-nums">
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
                      className="object-contain"
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
                    {news.image && news.image.trim() !== "" ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                        <img 
                          src={news.image} 
                          alt={news.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to LinkPreview if image fails to load
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'block'
                          }}
                        />
                        <div style={{ display: 'none' }}>
                          <LinkPreview 
                            url={news.link} 
                            fallbackTitle={news.title}
                          />
                        </div>
                      </div>
                    ) : (
                      <LinkPreview 
                        url={news.link} 
                        fallbackTitle={news.title}
                      />
                    )}
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
