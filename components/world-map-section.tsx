"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { X, TrendingDown, BarChart3, Building, Thermometer, Package, Zap, HardHat, Droplets, TrendingUp, Activity, ChevronLeft, ChevronRight, Home, Cloud, Truck, Factory, Users, Database, DollarSign, Globe, FlaskConical, Utensils, Wallet, ShoppingCart, Heart, Mountain, Palette, Users2, ChartCandlestick, Shirt, IdCardLanyard, Drill, ThermometerSun } from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { fetchDriversData, discoverAnalyses, DriverData, AnalysisInfo } from "@/lib/drivers-data"
import { useDataset } from "@/lib/dataset-context"

// Icon mapping based on category
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase()
  
  // Housing & Real Estate
  if (categoryLower.includes('housing') || categoryLower.includes('real estate') || categoryLower.includes('residential') || categoryLower.includes('property')) 
    return <Home className="h-full w-full text-muted-foreground" />
  
  // Construction & Infrastructure
  if (categoryLower.includes('construction') || categoryLower.includes('infrastructure') || categoryLower.includes('building') || categoryLower.includes('development') || categoryLower.includes('engineering') || categoryLower.includes('contracting')) 
    return <HardHat className="h-full w-full text-muted-foreground" />
  
  // Climate & Environment
  if (categoryLower.includes('climate') || categoryLower.includes('weather') || categoryLower.includes('environment') || categoryLower.includes('temperature') || categoryLower.includes('global warming') || categoryLower.includes('pollution') || categoryLower.includes('sustainability') || categoryLower.includes('green')) 
    return <ThermometerSun className="h-full w-full text-muted-foreground" />
  
  // Supply Chain & Trade
  if (categoryLower.includes('supply') || categoryLower.includes('trade') || categoryLower.includes('logistics') || categoryLower.includes('transport')) 
    return <Truck className="h-full w-full text-muted-foreground" />
  
  // Energy & Power
  if (categoryLower.includes('energy') || categoryLower.includes('power') || categoryLower.includes('electricity')) 
    return <Zap className="h-full w-full text-muted-foreground" />
  
  // Labor Market & Employment
  if (categoryLower.includes('labour') || categoryLower.includes('employment') || categoryLower.includes('jobs') || categoryLower.includes('hiring') || categoryLower.includes('unemployment') || categoryLower.includes('wages') || categoryLower.includes('salary') || categoryLower.includes('job market') || categoryLower.includes('workforce')) 
    return <IdCardLanyard className="h-full w-full text-muted-foreground" />
  
  // Workforce & Human Resources
  if (categoryLower.includes('workforce') || categoryLower.includes('hr') || categoryLower.includes('human resources') || categoryLower.includes('personnel') || categoryLower.includes('staffing') || categoryLower.includes('talent') || categoryLower.includes('recruitment')) 
    return <Users className="h-full w-full text-muted-foreground" />
  
  // Manufacturing & Production
  if (categoryLower.includes('volume') || categoryLower.includes('production') || categoryLower.includes('manufacturing') || categoryLower.includes('industry')) 
    return <Factory className="h-full w-full text-muted-foreground" />
  
  // Finance & Economics
  if (categoryLower.includes('price') || categoryLower.includes('inflation') || categoryLower.includes('finance') || categoryLower.includes('economy') || categoryLower.includes('gdp')) 
    return <DollarSign className="h-full w-full text-muted-foreground" />
  
  // Data & Analytics
  if (categoryLower.includes('data') || categoryLower.includes('analytics') || categoryLower.includes('statistics')) 
    return <Database className="h-full w-full text-muted-foreground" />
  
  // Global & International
  if (categoryLower.includes('global') || categoryLower.includes('international') || categoryLower.includes('world')) 
    return <Globe className="h-full w-full text-muted-foreground" />
  
  // Chemicals & Pharmaceuticals
  if (categoryLower.includes('chemical') || categoryLower.includes('pharmaceutical') || categoryLower.includes('medicine') || categoryLower.includes('drug') || categoryLower.includes('compound')) 
    return <FlaskConical className="h-full w-full text-muted-foreground" />
  
  // Food & Agriculture
  if (categoryLower.includes('food') || categoryLower.includes('processed') || categoryLower.includes('agriculture') || categoryLower.includes('farming') || categoryLower.includes('crop') || categoryLower.includes('grain') || categoryLower.includes('dairy') || categoryLower.includes('meat')) 
    return <Utensils className="h-full w-full text-muted-foreground" />
  
  // Income & Wealth
  if (categoryLower.includes('income') || categoryLower.includes('wealth') || categoryLower.includes('salary') || categoryLower.includes('wage') || categoryLower.includes('earnings') || categoryLower.includes('revenue')) 
    return <Wallet className="h-full w-full text-muted-foreground" />
  
  // Consumption & Retail
  if (categoryLower.includes('consumption') || categoryLower.includes('retail') || categoryLower.includes('shopping') || categoryLower.includes('spending') || categoryLower.includes('purchases') || categoryLower.includes('demand')) 
    return <ShoppingCart className="h-full w-full text-muted-foreground" />
  
  // Living Conditions & Quality of Life
  if (categoryLower.includes('living') || categoryLower.includes('quality') || categoryLower.includes('wellbeing') || categoryLower.includes('health') || categoryLower.includes('social') || categoryLower.includes('welfare') || categoryLower.includes('happiness')) 
    return <Heart className="h-full w-full text-muted-foreground" />
  
  // Minerals & Mining
  if (categoryLower.includes('mineral') || categoryLower.includes('mining') || categoryLower.includes('ore') || categoryLower.includes('metal') || categoryLower.includes('coal') || categoryLower.includes('gold') || categoryLower.includes('copper') || categoryLower.includes('iron') || categoryLower.includes('aluminum') || categoryLower.includes('lithium')) 
    return <Mountain className="h-full w-full text-muted-foreground" />
  
  // Textiles & Fibers
  if (categoryLower.includes('textile') || categoryLower.includes('fiber') || categoryLower.includes('fabric') || categoryLower.includes('cloth') || categoryLower.includes('cotton') || categoryLower.includes('wool') || categoryLower.includes('silk') || categoryLower.includes('synthetic') || categoryLower.includes('garment') || categoryLower.includes('apparel')) 
    return <Shirt className="h-full w-full text-muted-foreground" />
  
  // Crafts & Artisan
  if (categoryLower.includes('craft') || categoryLower.includes('artisan') || categoryLower.includes('handmade') || categoryLower.includes('artistic') || categoryLower.includes('creative') || categoryLower.includes('design') || categoryLower.includes('pottery') || categoryLower.includes('woodwork') || categoryLower.includes('jewelry')) 
    return <Drill className="h-full w-full text-muted-foreground" />
  
  // Population & Demographics
  if (categoryLower.includes('population') || categoryLower.includes('demographic') || categoryLower.includes('census') || categoryLower.includes('birth') || categoryLower.includes('death') || categoryLower.includes('migration') || categoryLower.includes('immigration') || categoryLower.includes('age') || categoryLower.includes('gender') || categoryLower.includes('ethnicity')) 
    return <Users2 className="h-full w-full text-muted-foreground" />
  
  // Market Indices & Trading
  if (categoryLower.includes('market') || categoryLower.includes('index') || categoryLower.includes('indices') || categoryLower.includes('trading') || categoryLower.includes('stock') || categoryLower.includes('equity') || categoryLower.includes('s&p') || categoryLower.includes('nasdaq') || categoryLower.includes('dow') || categoryLower.includes('ftse') || categoryLower.includes('candlestick')) 
    return <ChartCandlestick className="h-full w-full text-muted-foreground" />
  
  // Default fallback
  return <BarChart3 className="h-full w-full text-muted-foreground" />
}

export function WorldMapSection() {
  const { selectedDataset } = useDataset()
  const { theme } = useTheme()
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null)
  const [availableAnalyses, setAvailableAnalyses] = useState<AnalysisInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Generate chart data from driver's normalized series or fallback to sample data
  const generateDriverChartData = (driver: DriverData) => {
    console.log('Generating chart data for driver:', driver.name)
    console.log('Driver normalized_series:', driver.normalized_series)
    
    // Try to get real data from the driver if available
    if (driver.normalized_series) {
      const entries = Object.entries(driver.normalized_series)
      console.log('Raw entries from normalized_series:', entries.slice(0, 5)) // Show first 5 entries
      
      const seriesData = entries
        .filter(([_, value]) => value !== null) // Filter out null values
        .map(([date, value]) => {
          console.log('Processing date:', date, 'value:', value, 'type:', typeof date)
          
          // Parse date safely - handle YYYY-MM-DD format
          let parsedDate: Date
          try {
            // Ensure date string is in proper format
            const dateStr = date.toString()
            console.log('Date string to parse:', dateStr)
            
            if (dateStr.includes('-')) {
              // Handle YYYY-MM-DD format
              parsedDate = new Date(dateStr + 'T00:00:00')
            } else {
              parsedDate = new Date(dateStr)
            }
            
            console.log('Parsed date result:', parsedDate, 'isValid:', !isNaN(parsedDate.getTime()))
            
            // Validate the parsed date
            if (isNaN(parsedDate.getTime())) {
              console.warn(`Invalid date format: ${date}`, parsedDate)
              return null
            }
          } catch (error) {
            console.warn(`Error parsing date: ${date}`, error)
            return null
          }
          
          // Keep values in 0-1 range (don't multiply by 100)
          const numericValue = parseFloat((value as number).toFixed(3))
          
          const result = {
            date: parsedDate,
            value: numericValue
          }
          console.log('Created data point:', result)
          return result
        })
        .filter(item => item !== null) // Remove any failed date parsing
        .sort((a, b) => a!.date.getTime() - b!.date.getTime()) // Sort by date
        .slice(-24) // Take last 24 data points for better visualization
      
      console.log('Final series data:', seriesData)
      
      if (seriesData.length > 0) {
        return seriesData
      }
    }
    
    console.log('Using fallback sample data')
    // Fallback to sample data if no real data available
    const data = []
    const baseValue = driver.importance / 100 // Convert importance to 0-1 range
    
    for (let i = 0; i < 12; i++) {
      const randomVariation = (Math.random() - 0.5) * 0.2 // 20% volatility
      const value = Math.max(0, Math.min(1, baseValue + randomVariation))
      data.push({
        date: new Date(2023, i, 1), // Sample dates
        value: parseFloat(value.toFixed(3))
      })
    }
    return data
  }
  
  // Chart configuration for driver performance
  const driverChartConfig = {
    value: {
      label: "Performance",
      color: "var(--primary)",
    },
  } satisfies ChartConfig
  
  // Calculate badge size based on raw importance score (same as comparison cards)
  const getBadgeSize = (driver: DriverData, allDrivers: DriverData[]) => {
    if (allDrivers.length === 0) return { width: 'w-8', height: 'h-8', iconSize: 'w-3 h-3', borderWidth: 'border' }
    
    // Extract raw importance value (same logic as comparison cards)
    let rawImportance = 0
    if (driver.rawImportance && typeof driver.rawImportance === 'object') {
      const importanceObj = driver.rawImportance as any
      if (importanceObj.overall && typeof importanceObj.overall === 'object') {
        const overall = importanceObj.overall as any
        if (typeof overall.mean === 'number') {
          rawImportance = overall.mean
        }
      }
    }
    
    // If no raw importance, fallback to calculated importance
    if (rawImportance === 0) {
      rawImportance = driver.importance
    }
    
    const maxImportance = Math.max(...allDrivers.map(d => {
      let dImportance = 0
      if (d.rawImportance && typeof d.rawImportance === 'object') {
        const importanceObj = d.rawImportance as any
        if (importanceObj.overall && typeof importanceObj.overall === 'object') {
          const overall = importanceObj.overall as any
          if (typeof overall.mean === 'number') {
            dImportance = overall.mean
          }
        }
      }
      return dImportance > 0 ? dImportance : d.importance
    }))
    
    const minImportance = Math.min(...allDrivers.map(d => {
      let dImportance = 0
      if (d.rawImportance && typeof d.rawImportance === 'object') {
        const importanceObj = d.rawImportance as any
        if (importanceObj.overall && typeof importanceObj.overall === 'object') {
          const overall = importanceObj.overall as any
          if (typeof overall.mean === 'number') {
            dImportance = overall.mean
          }
        }
      }
      return dImportance > 0 ? dImportance : d.importance
    }))
    
    const importanceRange = maxImportance - minImportance
    
    if (importanceRange === 0) return { width: 'w-8', height: 'h-8', iconSize: 'w-3 h-3', borderWidth: 'border' }
    
    // Normalize importance to a scale of 0-1
    const normalizedImportance = (rawImportance - minImportance) / importanceRange
    
    // Map to size ranges: min size = 24px (w-6), max size = 56px (w-14)
    const sizeIndex = Math.floor(normalizedImportance * 4) // 0, 1, 2, 3, 4
    
    const sizes = [
      { width: 'w-6', height: 'h-6', iconSize: 'w-2 h-2', borderWidth: 'border' },      // 24px - Very small
      { width: 'w-8', height: 'h-8', iconSize: 'w-3 h-3', borderWidth: 'border-2' },    // 32px - Small
      { width: 'w-10', height: 'h-10', iconSize: 'w-4 h-4', borderWidth: 'border-2' },  // 40px - Medium
      { width: 'w-12', height: 'h-12', iconSize: 'w-5 h-5', borderWidth: 'border-2' },  // 48px - Large
      { width: 'w-14', height: 'h-14', iconSize: 'w-6 h-6', borderWidth: 'border-2' }   // 56px - Very large
    ]
    
    return sizes[Math.min(sizeIndex, sizes.length - 1)]
  }
  
  // Use ref to track current dataset and prevent stale requests
  const currentDatasetRef = useRef<string | null>(null)
  const currentAnalysisRef = useRef<string | null>(null)
  
  // Update refs when state changes
  useEffect(() => {
    currentDatasetRef.current = selectedDataset?.title || null
  }, [selectedDataset?.title])
  
  useEffect(() => {
    currentAnalysisRef.current = currentAnalysis
  }, [currentAnalysis])
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('State changed:', {
      selectedDataset: selectedDataset?.title,
      currentAnalysis,
      availableAnalyses: availableAnalyses.map(a => a.id),
      driversCount: drivers.length,
      selectedDriverId: selectedDriver?.id
    })
  }, [selectedDataset?.title, currentAnalysis, availableAnalyses, drivers.length, selectedDriver?.id])

  // Immediate state reset when dataset changes
  useEffect(() => {
    console.log('Dataset changed, immediately resetting state:', selectedDataset?.title)
    setCurrentAnalysis(null)
    setDrivers([])
    setSelectedDriver(null)
    setAvailableAnalyses([])
    setError(null)
    setLoading(false)
  }, [selectedDataset?.title])

  // Discover analyses when dataset changes
  useEffect(() => {
    const loadAnalyses = async () => {
      if (!selectedDataset) return
      
      console.log('Loading analyses for dataset:', selectedDataset.title)
      setLoading(true)
      
      try {
        const analyses = await discoverAnalyses(selectedDataset.title)
        console.log('Analyses discovered:', analyses)
        setAvailableAnalyses(analyses)
        
        // Set the first analysis as default if available
        if (analyses.length > 0) {
          console.log('Setting first analysis as default:', analyses[0].id)
          setCurrentAnalysis(analyses[0].id)
        } else {
          console.log('No analyses found for dataset')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading analyses:', error)
        setError(`Failed to load analyses: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setLoading(false)
      }
    }
    
    // Add a small delay to ensure state is stable
    const timeoutId = setTimeout(loadAnalyses, 100)
    
    return () => clearTimeout(timeoutId)
  }, [selectedDataset?.title]) // Use selectedDataset.title as dependency to ensure it triggers on dataset change

  // Load drivers when analysis changes
  useEffect(() => {
    const loadDrivers = async () => {
      // Early return if we don't have the required data
      if (!selectedDataset || !currentAnalysis || availableAnalyses.length === 0) {
        console.log('Skipping drivers load - missing required data:', { 
          hasDataset: !!selectedDataset, 
          hasAnalysis: !!currentAnalysis,
          hasAnalyses: availableAnalyses.length > 0,
          datasetTitle: selectedDataset?.title,
          analysisId: currentAnalysis,
          availableAnalysisIds: availableAnalyses.map(a => a.id)
        })
        return
      }
      
      // Verify that the current analysis exists in the available analyses for this dataset
      const analysisExists = availableAnalyses.some(a => a.id === currentAnalysis)
      if (!analysisExists) {
        console.log('Analysis not found in current dataset, skipping drivers load:', {
          analysisId: currentAnalysis,
          availableAnalyses: availableAnalyses.map(a => a.id),
          datasetTitle: selectedDataset.title
        })
        // Reset the current analysis if it's invalid
        setCurrentAnalysis(null)
        setDrivers([])
        setSelectedDriver(null)
        return
      }
      
      // Check if this request is still valid (dataset hasn't changed)
      if (currentDatasetRef.current !== selectedDataset.title || currentAnalysisRef.current !== currentAnalysis) {
        console.log('Dataset or analysis changed during request, skipping stale request:', {
          currentDataset: currentDatasetRef.current,
          selectedDataset: selectedDataset.title,
          currentAnalysis: currentAnalysisRef.current,
          analysisId: currentAnalysis
        })
        return
      }
      
      console.log('Loading drivers for dataset:', selectedDataset.title, 'analysis:', currentAnalysis)
      setLoading(true)
      setError(null)
      
      try {
        const driversData = await fetchDriversData(selectedDataset.title, currentAnalysis)
        
        // Check again if the request is still valid after fetching
        if (currentDatasetRef.current !== selectedDataset.title || currentAnalysisRef.current !== currentAnalysis) {
          console.log('Dataset or analysis changed after fetch, discarding results')
          return
        }
        
        console.log('Drivers loaded successfully:', driversData.length)
        console.log('Drivers with coordinates:', driversData.map(d => ({
          name: d.name,
          coords: d.coordinates,
          region: d.region
        })))
        setDrivers(driversData)
        setLoading(false)
        // Set the driver with highest importance as selected by default
        if (driversData.length > 0) {
          const highestImportanceDriver = getHighestImportanceDriver(driversData)
          if (highestImportanceDriver) {
            console.log('Setting highest importance driver as selected:', highestImportanceDriver.name)
            setSelectedDriver(highestImportanceDriver)
          } else {
            console.log('No valid drivers found in analysis')
            setSelectedDriver(null)
          }
        } else {
          console.log('No drivers found in analysis')
          setSelectedDriver(null)
        }
      } catch (error) {
        // Check if the request is still valid before setting error
        if (currentDatasetRef.current !== selectedDataset.title || currentAnalysisRef.current !== currentAnalysis) {
          console.log('Dataset or analysis changed during error, not setting error state')
          return
        }
        
        console.error('Error loading drivers:', error)
        setError(`Failed to load drivers: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setLoading(false)
        setDrivers([])
        setSelectedDriver(null)
      }
    }
    
    loadDrivers()
  }, [selectedDataset, currentAnalysis, availableAnalyses])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedDriver || drivers.length === 0) return
      
      const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id)
      
      if (event.key === 'ArrowLeft') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : drivers.length - 1
        setSelectedDriver(drivers[prevIndex])
      } else if (event.key === 'ArrowRight') {
        const nextIndex = currentIndex < drivers.length - 1 ? currentIndex + 1 : 0
        setSelectedDriver(drivers[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedDriver, drivers])

  const handleDriverClick = (driver: DriverData) => {
    setSelectedDriver(driver)
  }

  const handleAnalysisChange = (analysisId: string) => {
    setCurrentAnalysis(analysisId)
  }

  const getCurrentAnalysis = () => availableAnalyses.find(a => a.id === currentAnalysis)

  // Helper function to get the driver with the highest importance score
  const getHighestImportanceDriver = (driversList: DriverData[]) => {
    if (driversList.length === 0) return null
    
    return driversList.reduce((highest, driver) => {
      let importance = 0
      if (driver.rawImportance && typeof driver.rawImportance === 'object') {
        const importanceObj = driver.rawImportance as any
        if (importanceObj.overall && typeof importanceObj.overall === 'object') {
          const overall = importanceObj.overall as any
          if (typeof overall.mean === 'number') {
            importance = overall.mean
          }
        }
      }
      if (importance === 0) {
        importance = driver.importance
      }
      
      // Only consider drivers with importance > 0
      if (importance <= 0) return highest
      
      // If no highest driver yet, or current driver has higher importance
      if (!highest || importance > (() => {
        let highestImportance = 0
        if (highest.rawImportance && typeof highest.rawImportance === 'object') {
          const highestImportanceObj = highest.rawImportance as any
          if (highestImportanceObj.overall && typeof highestImportanceObj.overall === 'object') {
            const highestOverall = highestImportanceObj.overall as any
            if (typeof highestOverall.mean === 'number') {
              highestImportance = highestOverall.mean
            }
          }
        }
        if (highestImportance === 0) {
          highestImportance = highest.importance
        }
        return highestImportance
      })()) {
        return driver
      }
      
      return highest
    }, null as DriverData | null)
  }

  // Don't render if no dataset is selected
  if (!selectedDataset) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Please select a dataset to view drivers</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Select a dataset to view details</p>
          </div>
        </Card>
      </div>
    )
  }

  // Show error if there is one
  if (error) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-destructive">
            <div className="text-lg font-semibold mb-2">Error Loading Data</div>
            <p className="text-sm">{error}</p>
            <Button 
              onClick={() => {
                setError(null)
                setLoading(true)
                // Retry loading
                if (currentAnalysis) {
                  fetchDriversData(selectedDataset.title, currentAnalysis)
                    .then(driversData => {
                      setDrivers(driversData)
                      setLoading(false)
                      if (driversData.length > 0) {
                        const highestImportanceDriver = getHighestImportanceDriver(driversData)
                        if (highestImportanceDriver) {
                          setSelectedDriver(highestImportanceDriver)
                        }
                      }
                    })
                    .catch(err => {
                      setError(`Retry failed: ${err.message}`)
                      setLoading(false)
                    })
                }
              }}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Error occurred while loading data</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
            <p>Loading drivers data...</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Select a driver to view details</p>
          </div>
        </Card>
      </div>
    )
  }

  // Don't render if no analyses are available
  if (availableAnalyses.length === 0) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No analyses available for {selectedDataset.title}</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No analyses found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full flex gap-4">
      {/* Map - Left Side (2/3 width) */}
      <div className="flex-1 h-[400px] md:h-[500px] overflow-hidden p-0">
        <div className="relative w-full h-full">
          {/* Map Background */}
          <img 
            src="/map.svg" 
            alt="World Map" 
            className="w-full h-full object-contain dark:invert dark:brightness-0 dark:contrast-200"
            style={{ minWidth: '100%', minHeight: '100%' }}
          />
          

          

          
          {/* Analysis Navigation */}
          <div className="absolute top-2 left-2">
            <ToggleGroup
              type="single"
              value={currentAnalysis || ""}
              onValueChange={handleAnalysisChange}
              variant="outline"
              className="w-auto"
            >
              {availableAnalyses.map((analysis) => (
                <ToggleGroupItem 
                  key={analysis.id} 
                  value={analysis.id}
                  className="text-xs px-3 py-1"
                >
                  {analysis.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          

          
          {/* Driver Icons */}
          <TooltipProvider>
            {drivers
              .filter(driver => {
                // Filter out drivers with 0 importance
                let importance = 0
                if (driver.rawImportance && typeof driver.rawImportance === 'object') {
                  const importanceObj = driver.rawImportance as any
                  if (importanceObj.overall && typeof importanceObj.overall === 'object') {
                    const overall = importanceObj.overall as any
                    if (typeof overall.mean === 'number') {
                      importance = overall.mean
                    }
                  }
                }
                if (importance === 0) {
                  importance = driver.importance
                }
                return importance > 0
              })
              .map((driver, index) => (
              <Tooltip key={driver.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDriverClick(driver)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 focus:outline-none"
                    style={{
                      left: `${driver.coordinates.x}%`,
                      top: `${driver.coordinates.y}%`
                    }}
                  >
                    {(() => {
                      const size = getBadgeSize(driver, drivers)
                      return (
                        <Badge 
                          variant="outline" 
                          className={`${size.width} ${size.height} rounded-full p-1 ${size.borderWidth} transition-all duration-200 ${
                            selectedDriver?.id === driver.id
                              ? 'border-primary bg-primary/20 shadow-lg ring-2 ring-primary/20 dark:bg-primary/30 dark:ring-primary/30' 
                              : 'border-border bg-muted hover:border-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/60'
                          }`}
                        >
                          <div className={size.iconSize}>
                            {getCategoryIcon(driver.category)}
                          </div>
                        </Badge>
                      )
                    })()}
                    

                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs text-xs bg-popover text-popover-foreground border border-border shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{index + 1}. {driver.name}</div>
                    <div className="text-muted-foreground">{driver.category}</div>
                    <div className="text-muted-foreground">
                      ({driver.coordinates.x.toFixed(1)}%, {driver.coordinates.y.toFixed(1)}%)
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Drivers Card - Right Side (1/3 width) */}
      <Card className="w-80 h-auto min-h-[400px] md:min-h-[500px]">

        
        <CardContent>
          {selectedDriver ? (
            <div className="space-y-2">
              {/* Driver Header */}
              <div className="flex flex-col items-start gap-3 pb-1">
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-3 w-3 text-muted-foreground">{getCategoryIcon(selectedDriver.category)}</span>
                    <span className="line-clamp-1">{selectedDriver.category}</span>
                  </p>
                  {selectedDriver.name.length > 60 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className="font-normal font-mono text-foreground text-lg line-clamp-2 cursor-help">{selectedDriver.name}</h4>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="max-w-xs text-xs bg-popover text-popover-foreground border border-border shadow-lg"
                      >
                        <div className="font-normal font-mono">{selectedDriver.name}</div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <h4 className="font-normal font-mono text-foreground text-lg">{selectedDriver.name}</h4>
                  )}

                  <p className="text-xs text-muted-foreground">{selectedDriver.region.filter(region => region !== 'World').join(' → ')}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="text-left">
                <div className="text-4xl font-bold text-foreground">
                  {(() => {
                    // Use the same calculation as drivers comparison cards
                    let importance = 0
                    if (selectedDriver.rawImportance && typeof selectedDriver.rawImportance === 'object') {
                      const importanceObj = selectedDriver.rawImportance as any
                      if (importanceObj.overall && typeof importanceObj.overall === 'object') {
                        const overall = importanceObj.overall as any
                        if (typeof overall.mean === 'number') {
                          importance = Math.round(overall.mean) // Round to whole percentage like comparison cards
                        }
                      }
                    }
                    // Fallback to the current importance if the above structure doesn't exist
                    return importance > 0 ? `${importance}%` : `${selectedDriver.importance.toFixed(1)}%`
                  })()}
                </div>
                {/* <div className="text-xs text-muted-foreground">Importance Score</div> */}
              </div>

              {/* Direction and Lag Information */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={`flex items-center gap-2 ${
                    selectedDriver.direction > 0 
                      ? 'bg-sibvi-green-500 text-white' 
                      : 'bg-sibvi-red-400 text-white'
                  }`}
                >
                  {selectedDriver.direction > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {selectedDriver.direction > 0 ? 'Positive' : 'Negative'} Impact
                </Badge>
                
                <span className="text-xs text-muted-foreground">
                  Lag: {selectedDriver.lag}
                </span>
              </div>

              {/* Driver Performance Chart */}
              <div className="w-full">
                {(() => {
                  const chartData = generateDriverChartData(selectedDriver)
                  console.log('Chart data being passed to LineChart:', chartData)
                  return null
                })()}
                <ChartContainer config={driverChartConfig} className="h-46 w-full -ml-2">
                  <LineChart 
                    data={generateDriverChartData(selectedDriver)}
                    margin={{ left: 8, right: 8, top: 8, bottom: -20 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={false}
                      tickMargin={0}
                      minTickGap={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={false}
                      tickMargin={0}
                      minTickGap={0}
                      width={0}
                      domain={['dataMin', 'dataMax']}
                    />
                    <RechartsTooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0]
                          const date = dataPoint.payload.date
                          const value = dataPoint.value
                          
                          console.log('Tooltip data:', { date, value, label })
                          
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <div className="text-sm font-medium text-popover-foreground">
                                {date instanceof Date ? date.toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                }) : 'Unknown Date'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Performance: {typeof value === 'number' ? value.toFixed(3) : value}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      dataKey="value"
                      type="natural"
                      stroke="var(--color-value)"
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed">
                This driver shows {selectedDriver.direction > 0 ? 'positive' : 'negative'} correlation 
                with the target variable, with an importance score of {selectedDriver.importance.toFixed(1)}% 
                and a lag of {selectedDriver.lag}.
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Badge 
                variant="outline" 
                className="w-16 h-16 mx-auto mb-4 rounded-full p-0 bg-muted border-border"
              >
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </Badge>
              <p className="text-sm">Select a driver from the map to view details</p>
              <p className="text-xs mt-2">Click on any icon to explore driver data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
