"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { X, TrendingDown, BarChart3, Building, Thermometer, Package, Zap, HardHat, Droplets, TrendingUp, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchDriversData, discoverAnalyses, DriverData, AnalysisInfo } from "@/lib/drivers-data"
import { useDataset } from "@/lib/dataset-context"

// Icon mapping based on category
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('housing') || categoryLower.includes('construction')) return <Building className="h-full w-full text-gray-500" />
  if (categoryLower.includes('climate') || categoryLower.includes('weather')) return <Thermometer className="h-full w-full text-gray-500" />
  if (categoryLower.includes('supply') || categoryLower.includes('trade')) return <Package className="h-full w-full text-gray-500" />
  if (categoryLower.includes('energy') || categoryLower.includes('power')) return <Zap className="h-full w-full text-gray-500" />
  if (categoryLower.includes('labour') || categoryLower.includes('employment')) return <HardHat className="h-full w-full text-gray-500" />
  if (categoryLower.includes('volume') || categoryLower.includes('production')) return <Activity className="h-full w-full text-gray-500" />
  if (categoryLower.includes('price') || categoryLower.includes('inflation')) return <TrendingUp className="h-full w-full text-gray-500" />
  return <BarChart3 className="h-full w-full text-gray-500" />
}

export function WorldMapSection() {
  const { selectedDataset } = useDataset()
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null)
  const [availableAnalyses, setAvailableAnalyses] = useState<AnalysisInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Calculate badge size based on importance score
  const getBadgeSize = (importance: number, allDrivers: DriverData[]) => {
    if (allDrivers.length === 0) return { width: 'w-8', height: 'h-8', iconSize: 'w-3 h-3', borderWidth: 'border' }
    
    const maxImportance = Math.max(...allDrivers.map(d => d.importance))
    const minImportance = Math.min(...allDrivers.map(d => d.importance))
    const importanceRange = maxImportance - minImportance
    
    if (importanceRange === 0) return { width: 'w-8', height: 'h-8', iconSize: 'w-3 h-3', borderWidth: 'border' }
    
    // Normalize importance to a scale of 0-1
    const normalizedImportance = (importance - minImportance) / importanceRange
    
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
        // Set the first driver as selected by default
        if (driversData.length > 0) {
          console.log('Setting first driver as selected:', driversData[0].name)
          setSelectedDriver(driversData[0])
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

  // Don't render if no dataset is selected
  if (!selectedDataset) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Please select a dataset to view drivers</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
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
          <div className="text-center text-red-500">
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
                        setSelectedDriver(driversData[0])
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
          <div className="text-center text-gray-500">
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
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading drivers data...</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
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
          <div className="text-center text-gray-500">
            <p>No analyses available for {selectedDataset.title}</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No analyses found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full flex gap-4">
      {/* Map Card - Left Side (2/3 width) */}
      <Card className="flex-1 h-[500px] md:h-[600px] overflow-hidden">
        <div className="relative w-full h-full">
          <img 
            src="/map.svg" 
            alt="World Map" 
            className="w-full h-full object-contain"
            style={{ minWidth: '100%', minHeight: '100%' }}
          />
          
          {/* Debug Overlay */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            Drivers: {drivers.length} | Visible: {drivers.filter(d => d.coordinates.x >= 0 && d.coordinates.x <= 100 && d.coordinates.y >= 0 && d.coordinates.y <= 100).length}
          </div>
          

          
          {/* Analysis Navigation */}
          <div className="absolute top-2 right-2 bg-white/90 rounded-lg p-2 shadow-lg">
            <div className="text-xs text-gray-600 mb-1">Current Analysis:</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentIndex = availableAnalyses.findIndex(a => a.id === currentAnalysis)
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableAnalyses.length - 1
                  handleAnalysisChange(availableAnalyses[prevIndex].id)
                }}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              
              <span className="text-sm font-medium text-gray-700 px-2">
                {getCurrentAnalysis()?.name || "Unknown"}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentIndex = availableAnalyses.findIndex(a => a.id === currentAnalysis)
                  const nextIndex = currentIndex < availableAnalyses.length - 1 ? currentIndex + 1 : 0
                  handleAnalysisChange(availableAnalyses[nextIndex].id)
                }}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {availableAnalyses.findIndex(a => a.id === currentAnalysis)! + 1} / {availableAnalyses.length}
            </div>
          </div>
          
          {/* Driver Navigation Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedDriver) {
                  const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id)
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : drivers.length - 1
                  setSelectedDriver(drivers[prevIndex])
                }
              }}
              className="bg-white/90 hover:bg-white"
            >
              ← Previous
            </Button>
            
            <div className="bg-white/90 px-3 py-2 rounded-md text-sm font-medium text-gray-700 flex items-center gap-2">
              <span>{drivers.findIndex(d => d.id === selectedDriver?.id) + 1}</span>
              <span className="text-gray-400">/</span>
              <span>{drivers.length}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedDriver) {
                  const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id)
                  const nextIndex = currentIndex < drivers.length - 1 ? currentIndex + 1 : 0
                  setSelectedDriver(drivers[nextIndex])
                }
              }}
              className="bg-white/90 hover:bg-white"
            >
              Next →
            </Button>
          </div>
          
          {/* Driver Icons */}
          <TooltipProvider>
            {drivers.map((driver, index) => (
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
                      const size = getBadgeSize(driver.importance, drivers)
                      return (
                        <Badge 
                          variant="outline" 
                          className={`${size.width} ${size.height} rounded-full p-1 ${size.borderWidth} transition-all duration-200 ${
                            selectedDriver?.id === driver.id
                              ? 'border-blue-500 bg-blue-100 shadow-lg' 
                              : 'border-gray-400 bg-gray-50 hover:border-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <div className={size.iconSize}>
                            {getCategoryIcon(driver.category)}
                          </div>
                        </Badge>
                      )
                    })()}
                    
                    {/* Numbered Badge */}
                    {(() => {
                      const size = getBadgeSize(driver.importance, drivers)
                      const badgeOffset = size.width === 'w-6' ? '-top-0.5 -right-0.5' : 
                                        size.width === 'w-8' ? '-top-1 -right-1' : 
                                        size.width === 'w-10' ? '-top-1 -right-1' : 
                                        size.width === 'w-12' ? '-top-1 -right-1' : '-top-1 -right-1'
                      return (
                        <Badge 
                          variant="destructive" 
                          className={`absolute ${badgeOffset} w-4 h-4 p-0 text-xs rounded-full flex items-center justify-center min-w-0`}
                        >
                          {index + 1}
                        </Badge>
                      )
                    })()}
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs text-xs bg-white text-gray-900 border border-gray-200 shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{index + 1}. {driver.name}</div>
                    <div className="text-gray-600">{driver.category}</div>
                    <div className="text-gray-500">
                      ({driver.coordinates.x.toFixed(1)}%, {driver.coordinates.y.toFixed(1)}%)
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </Card>

      {/* Drivers Card - Right Side (1/3 width) */}
      <Card className="w-80 h-[500px] md:h-[600px] overflow-y-auto">
        <CardHeader className="pb-3 border-b">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {drivers.length} drivers available • {drivers.filter(d => d.coordinates.x >= 0 && d.coordinates.x <= 100 && d.coordinates.y >= 0 && d.coordinates.y <= 100).length} visible on map
            </p>
            <p className="text-xs text-blue-600 font-medium">
              {selectedDataset.title} • {getCurrentAnalysis()?.name}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {selectedDriver ? (
            <div className="space-y-4">
              {/* Driver Header */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <Badge 
                  variant="outline" 
                  className="w-10 h-10 rounded-full p-0 border border-gray-200 bg-gray-100"
                >
                  <div className="w-5 h-5">
                    {getCategoryIcon(selectedDriver.category)}
                  </div>
                </Badge>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{selectedDriver.name}</h4>
                  <p className="text-xs text-gray-600">{selectedDriver.region.join(' > ')}</p>
                  <p className="text-xs text-blue-600">{selectedDriver.category}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{selectedDriver.importance.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Importance Score</div>
              </div>

              {/* Direction Indicator */}
              <div className={`rounded-lg p-3 ${
                selectedDriver.direction > 0 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedDriver.direction > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-700" />
                  )}
                  <span className={`text-sm font-medium ${
                    selectedDriver.direction > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedDriver.direction > 0 ? 'Positive' : 'Negative'} Impact
                  </span>
                </div>
              </div>

              {/* Lag Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Lag:</span> {selectedDriver.lag}
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Badge 
                    variant="outline" 
                    className="w-8 h-8 mx-auto mb-2 rounded-full p-0 bg-gray-200 border-gray-300"
                  >
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </Badge>
                  <p className="text-sm">Chart visualization</p>
                  <p className="text-xs">Driver: {selectedDriver.id}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                This driver shows {selectedDriver.direction > 0 ? 'positive' : 'negative'} correlation 
                with the target variable, with an importance score of {selectedDriver.importance.toFixed(1)}% 
                and a lag of {selectedDriver.lag}.
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Badge 
                variant="outline" 
                className="w-16 h-16 mx-auto mb-4 rounded-full p-0 bg-gray-100 border-gray-300"
              >
                <BarChart3 className="h-8 w-8 text-gray-300" />
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
