export interface DriverData {
  id: string
  name: string
  region: string[]
  category: string
  isPublic: boolean
  importance: number
  direction: number
  lag: string
  coordinates: {
    x: number
    y: number
    continent: string
  }
}

export interface RegionMapping {
  [key: string]: {
    x: number
    y: number
    continent: string
  }
}

export interface AnalysisInfo {
  id: string
  name: string
  driverCount: number
  path: string
}

export interface DatasetInfo {
  id: string
  name: string
  analyses: AnalysisInfo[]
}

// Map regions to approximate coordinates on the world map
export const regionCoordinates: RegionMapping = {
  "United States of America": { x: 22, y: 37, continent: "North America" },
  "Canada": { x: 25, y: 35, continent: "North America" },
  "Mexico": { x: 20, y: 42, continent: "North America" },
  "Brazil": { x: 33, y: 75, continent: "South America" },
  "Argentina": { x: 30, y: 82, continent: "South America" },
  "Chile": { x: 25, y: 85, continent: "South America" },
  "United Kingdom": { x: 45, y: 35, continent: "Europe" },
  "Germany": { x: 48, y: 38, continent: "Europe" },
  "France": { x: 47, y: 40, continent: "Europe" },
  "Italy": { x: 49, y: 42, continent: "Europe" },
  "Spain": { x: 44, y: 42, continent: "Europe" },
  "Poland": { x: 50, y: 38, continent: "Europe" },
  "Russia": { x: 55, y: 35, continent: "Europe" },
  "China": { x: 75, y: 45, continent: "Asia" },
  "Japan": { x: 85, y: 42, continent: "Asia" },
  "India": { x: 68, y: 55, continent: "Asia" },
  "South Korea": { x: 82, y: 42, continent: "Asia" },
  "Singapore": { x: 78, y: 65, continent: "Asia" },
  "Indonesia": { x: 80, y: 70, continent: "Asia" },
  "Australia": { x: 82, y: 82, continent: "Oceania" },
  "New Zealand": { x: 88, y: 85, continent: "Oceania" },
  "South Africa": { x: 48, y: 75, continent: "Africa" },
  "Nigeria": { x: 45, y: 65, continent: "Africa" },
  "Egypt": { x: 52, y: 55, continent: "Africa" },
  "Kenya": { x: 55, y: 70, continent: "Africa" },
  "Morocco": { x: 42, y: 50, continent: "Africa" },
  "Turkey": { x: 55, y: 45, continent: "Asia" },
  "Saudi Arabia": { x: 60, y: 55, continent: "Asia" },
  "Iran": { x: 65, y: 52, continent: "Asia" },
  "Pakistan": { x: 65, y: 55, continent: "Asia" },
  "Thailand": { x: 75, y: 65, continent: "Asia" },
  "Vietnam": { x: 78, y: 65, continent: "Asia" },
  "Malaysia": { x: 76, y: 68, continent: "Asia" },
  "Philippines": { x: 82, y: 65, continent: "Asia" },
  "World": { x: 50, y: 50, continent: "Global" },
  "Americas": { x: 25, y: 50, continent: "Americas" },
  "Europe": { x: 48, y: 40, continent: "Europe" },
  "Asia": { x: 75, y: 50, continent: "Asia" },
  "Africa": { x: 50, y: 70, continent: "Africa" },
  "Oceania": { x: 85, y: 80, continent: "Oceania" }
}

// Function to discover available analyses for a dataset
export async function discoverAnalyses(datasetId: string): Promise<AnalysisInfo[]> {
  try {
    const response = await fetch(`/api/data-folders/${datasetId}/analyses`)
    if (!response.ok) {
      throw new Error(`Failed to fetch analyses for dataset ${datasetId}`)
    }
    
    const analyses = await response.json()
    return analyses
  } catch (error) {
    console.error(`Error discovering analyses for dataset ${datasetId}:`, error)
    return []
  }
}

export async function fetchDriversData(datasetId: string, analysisId: string): Promise<DriverData[]> {
  try {
    // First, get the analysis info to find the correct path
    const analysesResponse = await fetch(`/api/data-folders/${encodeURIComponent(datasetId)}/analyses`)
    if (!analysesResponse.ok) {
      throw new Error(`Failed to fetch analyses for dataset ${datasetId}`)
    }
    
    const analyses = await analysesResponse.json()
    const analysis = analyses.find((a: AnalysisInfo) => a.id === analysisId)
    
    if (!analysis) {
      const availableAnalysisIds = analyses.map((a: AnalysisInfo) => a.id).join(', ')
      throw new Error(`Analysis ${analysisId} not found in dataset ${datasetId}. Available analyses: ${availableAnalysisIds}`)
    }
    
    const analysisPath = analysis.path
    console.log(`Fetching drivers from: ${analysisPath}`)
    console.log(`Dataset: ${datasetId}, Analysis: ${analysisId}`)
    
    const response = await fetch(analysisPath)
    console.log(`Response status: ${response.status}, ok: ${response.ok}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HTTP Error ${response.status}: ${errorText}`)
      throw new Error(`Failed to fetch drivers data: HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Raw data received:', typeof data, 'Keys:', Object.keys(data))
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format received')
    }
    
    const drivers: DriverData[] = []
    
    console.log('Raw data keys:', Object.keys(data).length)
    
    for (const [id, driverData] of Object.entries(data)) {
      try {
        const typedDriverData = driverData as any
        console.log(`Processing driver ${id}:`, typedDriverData)
        
        if (!typedDriverData.driver_name) {
          console.warn(`Driver ${id} missing driver_name:`, typedDriverData)
          continue
        }
        
        // Handle different region formats
        let regionNames: string[] = []
        if (typedDriverData.region && Array.isArray(typedDriverData.region)) {
          if (typedDriverData.region.length > 0 && typeof typedDriverData.region[0] === 'object' && typedDriverData.region[0].name) {
            regionNames = typedDriverData.region.map((r: any) => r.name)
          } else if (typedDriverData.region.length > 0 && typeof typedDriverData.region[0] === 'string') {
            regionNames = typedDriverData.region
          }
        }
        
        // If no regions found, try to extract from driver name or use default
        if (regionNames.length === 0) {
          // Try to extract region from driver name
          const nameParts = typedDriverData.driver_name.split(',')
          if (nameParts.length > 1) {
            // Look for common region indicators in the name
            const regionIndicators = ['US', 'United States', 'Europe', 'Asia', 'Africa', 'Australia', 'Canada', 'Mexico', 'Brazil', 'China', 'Japan', 'India']
            for (const part of nameParts) {
              const trimmed = part.trim()
              if (regionIndicators.some(indicator => trimmed.includes(indicator))) {
                regionNames = ['World', trimmed]
                break
              }
            }
          }
          
          // Default to World if still no regions
          if (regionNames.length === 0) {
            regionNames = ['World']
          }
        }
        
        const primaryRegion = regionNames[regionNames.length - 1] // Get the most specific region
        
        let coordinates = regionCoordinates[primaryRegion] || regionCoordinates[regionNames[0]] || regionCoordinates["World"]
        
        // If multiple drivers have the same region, offset them in a grid pattern with more spacing
        const existingDriversAtRegion = drivers.filter(d => 
          Math.abs(d.coordinates.x - coordinates.x) < 8 && Math.abs(d.coordinates.y - coordinates.y) < 8
        )
        
        if (existingDriversAtRegion.length > 0) {
          // Create a grid offset pattern with more spacing
          const gridSize = Math.ceil(Math.sqrt(existingDriversAtRegion.length + 1))
          const gridIndex = existingDriversAtRegion.length
          const row = Math.floor(gridIndex / gridSize)
          const col = gridIndex % gridSize
          
          coordinates = {
            ...coordinates,
            x: Math.min(90, Math.max(5, coordinates.x + (col - 1) * 6)),
            y: Math.min(90, Math.max(5, coordinates.y + (row - 1) * 6))
          }
        }
        
        // Additional continent-based positioning for better distribution
        const continentDrivers = drivers.filter(d => d.coordinates.continent === coordinates.continent)
        if (continentDrivers.length > 0) {
          // Spread out drivers within the same continent
          const continentIndex = continentDrivers.length
          const angle = (continentIndex * 45) * (Math.PI / 180) // 45-degree increments
          const radius = 8 // Distance from center
          
          coordinates = {
            ...coordinates,
            x: Math.min(90, Math.max(5, coordinates.x + Math.cos(angle) * radius)),
            y: Math.min(90, Math.max(5, coordinates.y + Math.sin(angle) * radius))
          }
        }
        
        // Ensure coordinates are within bounds
        coordinates.x = Math.min(95, Math.max(5, coordinates.x))
        coordinates.y = Math.min(95, Math.max(5, coordinates.y))
        
        // Extract category information
        let category = "Unknown"
        if (typedDriverData.category && Array.isArray(typedDriverData.category) && typedDriverData.category.length > 0) {
          if (typeof typedDriverData.category[0] === 'object' && typedDriverData.category[0].name) {
            category = typedDriverData.category[0].name
          } else if (typeof typedDriverData.category[0] === 'string') {
            category = typedDriverData.category[0]
          }
        }
        
        // Extract importance and direction from correlation data
        let importance = 0
        let direction = 0
        
        if (typedDriverData.pearson_correlation?.overall?.mean !== undefined) {
          importance = Math.abs(typedDriverData.pearson_correlation.overall.mean) * 100
          direction = typedDriverData.pearson_correlation.overall.mean
        } else if (typedDriverData.granger_correlation?.overall?.mean !== undefined) {
          importance = Math.abs(typedDriverData.granger_correlation.overall.mean) * 100
          direction = typedDriverData.granger_correlation.overall.mean
        }
        
        // Extract lag information
        let lag = "Unknown"
        if (typedDriverData.overall_lag) {
          lag = typedDriverData.overall_lag
        } else if (typedDriverData.pearson_correlation) {
          // Find the lag with highest correlation
          const lags = Object.keys(typedDriverData.pearson_correlation).filter(k => k.startsWith('lag_'))
          if (lags.length > 0) {
            const highestLag = lags.reduce((a, b) => 
              Math.abs(typedDriverData.pearson_correlation[a]) > Math.abs(typedDriverData.pearson_correlation[b]) ? a : b
            )
            lag = highestLag.replace('lag_', '') + ' month(s)'
          }
        }
        
        const driver = {
          id,
          name: typedDriverData.driver_name,
          region: regionNames,
          category: category,
          isPublic: typedDriverData.is_public || false,
          importance: importance,
          direction: direction,
          lag: lag,
          coordinates
        }
        
        drivers.push(driver)
        console.log(`Driver processed: ${typedDriverData.driver_name} at (${coordinates.x.toFixed(1)}%, ${coordinates.y.toFixed(1)}%) - Region: ${primaryRegion}`)
      } catch (driverError) {
        console.error(`Error processing driver ${id}:`, driverError)
        continue
      }
    }
    
    console.log(`Total drivers processed: ${drivers.length}`)
    console.log('All driver coordinates:', drivers.map(d => ({ name: d.name, coords: d.coordinates })))
    
    return drivers
  } catch (error) {
    console.error('Error in fetchDriversData:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      datasetId,
      analysisId
    })
    throw error
  }
}
