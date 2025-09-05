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
  normalized_series?: {
    [date: string]: number | null
  }
  rawImportance?: any
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

// SVG dimensions and coordinate system
const SVG_WIDTH = 552
const SVG_HEIGHT = 267
const SVG_VIEWBOX = { x: 0, y: 0, width: 552, height: 267 }

// Geographic coordinate mapping with latitude/longitude for precise positioning
interface GeographicCoordinates {
  latitude: number
  longitude: number
  continent: string
}

// Map regions to precise geographic coordinates (latitude, longitude)
export const geographicCoordinates: { [key: string]: GeographicCoordinates } = {
  "United States of America": { latitude: 39.8283, longitude: -98.5795, continent: "North America" },
  "Canada": { latitude: 56.1304, longitude: -106.3468, continent: "North America" },
  "Mexico": { latitude: 23.6345, longitude: -102.5528, continent: "North America" },
  "Brazil": { latitude: -14.2350, longitude: -51.9253, continent: "South America" },
  "Argentina": { latitude: -38.4161, longitude: -63.6167, continent: "South America" },
  "Chile": { latitude: -35.6751, longitude: -71.5430, continent: "South America" },
  "United Kingdom of Great Britain and Northern Ireland": { latitude: 55.3781, longitude: -3.4360, continent: "Europe" },
  "Germany": { latitude: 51.1657, longitude: 10.4515, continent: "Europe" },
  "France": { latitude: 46.2276, longitude: 2.2137, continent: "Europe" },
  "Italy": { latitude: 41.8719, longitude: 12.5674, continent: "Europe" },
  "Spain": { latitude: 40.4637, longitude: -3.7492, continent: "Europe" },
  "Poland": { latitude: 51.9194, longitude: 19.1451, continent: "Europe" },
  "Russia": { latitude: 61.5240, longitude: 105.3188, continent: "Asia" },
  "China": { latitude: 35.8617, longitude: 104.1954, continent: "Asia" },
  "Japan": { latitude: 36.2048, longitude: 138.2529, continent: "Asia" },
  "India": { latitude: 20.5937, longitude: 78.9629, continent: "Asia" },
  "South Korea": { latitude: 35.9078, longitude: 127.7669, continent: "Asia" },
  "Singapore": { latitude: 1.3521, longitude: 103.8198, continent: "Asia" },
  "Indonesia": { latitude: -0.7893, longitude: 113.9213, continent: "Asia" },
  "Australia": { latitude: -25.2744, longitude: 133.7751, continent: "Oceania" },
  "New Zealand": { latitude: -40.9006, longitude: 174.8860, continent: "Oceania" },
  "South Africa": { latitude: -30.5595, longitude: 22.9375, continent: "Africa" },
  "Nigeria": { latitude: 9.0820, longitude: 8.6753, continent: "Africa" },
  "Egypt": { latitude: 26.0975, longitude: 30.0444, continent: "Africa" },
  "Kenya": { latitude: -0.0236, longitude: 37.9062, continent: "Africa" },
  "Morocco": { latitude: 31.6295, longitude: -7.9811, continent: "Africa" },
  "Saudi Arabia": { latitude: 23.8859, longitude: 45.0792, continent: "Asia" },
  "Iran": { latitude: 32.4279, longitude: 53.6880, continent: "Asia" },
  "Pakistan": { latitude: 30.3753, longitude: 69.3451, continent: "Asia" },
  "Thailand": { latitude: 15.8700, longitude: 100.9925, continent: "Asia" },
  "Vietnam": { latitude: 14.0583, longitude: 108.2772, continent: "Asia" },
  "Malaysia": { latitude: 4.2105, longitude: 101.9758, continent: "Asia" },
  "Philippines": { latitude: 12.8797, longitude: 121.7740, continent: "Asia" },
  "World": { latitude: 0, longitude: 0, continent: "Global" },
  "Americas": { latitude: 15.7835, longitude: -90.2308, continent: "Americas" },
  "Europe": { latitude: 54.5260, longitude: 15.2551, continent: "Europe" },
  "Armenia": { latitude: 40.0691, longitude: 45.0382, continent: "Asia" },
  "Cyprus": { latitude: 35.1264, longitude: 33.4299, continent: "Europe" },
  "Portugal": { latitude: 39.3999, longitude: -8.2245, continent: "Europe" },
  "Denmark": { latitude: 56.2639, longitude: 9.5018, continent: "Europe" },
  "Sweden": { latitude: 60.1282, longitude: 18.6435, continent: "Europe" },
  "Turkey": { latitude: 38.9637, longitude: 35.2433, continent: "Asia" },
  "Finland": { latitude: 61.9241, longitude: 25.7482, continent: "Europe" },
  "Lithuania": { latitude: 55.1694, longitude: 23.8813, continent: "Europe" },
  "Myanmar": { latitude: 21.9162, longitude: 95.9560, continent: "Asia" },
  "Slovakia": { latitude: 48.6690, longitude: 19.6990, continent: "Europe" },
  "Slovenia": { latitude: 46.1512, longitude: 14.9955, continent: "Europe" },
  "Belgium": { latitude: 50.5039, longitude: 4.4699, continent: "Europe" },
  "Asia": { latitude: 34.0479, longitude: 100.6197, continent: "Asia" },
  "Africa": { latitude: -8.7832, longitude: 34.5085, continent: "Africa" },
  "Oceania": { latitude: -25.2744, longitude: 133.7751, continent: "Oceania" }
}

// Convert geographic coordinates to SVG coordinates
function geographicToSVG(lat: number, lng: number): { x: number; y: number } {
  // This SVG appears to use a custom projection optimized for the specific map design
  // We'll use a modified equirectangular projection with adjustments for the SVG layout
  
  const mapWidth = SVG_WIDTH
  const mapHeight = SVG_HEIGHT
  
  // Convert longitude to x coordinate (0-360 degrees to 0-552 pixels)
  // Adjust longitude range to better fit the SVG (approximately -180 to 180)
  let x = ((lng + 180) / 360) * mapWidth
  
  // Convert latitude to y coordinate (90 to -90 degrees to 0-267 pixels)
  // The SVG appears to have some vertical offset, so we adjust the range
  let y = ((90 - lat) / 180) * mapHeight
  
  // Apply adjustments based on the actual SVG layout
  // These values are tuned to better match the visual layout of the map.svg
  const longitudeOffset = 0.02 // Reduced shift to better align with continents
  const latitudeOffset = 0.05 // Reduced shift to better align with continents
  
  x = x + (longitudeOffset * mapWidth)
  y = y + (latitudeOffset * mapHeight)
  
  // Apply additional corrections for specific regions to improve accuracy
  // These are fine-tuned adjustments based on the actual SVG layout
  
  // North America adjustments
  if (lng >= -170 && lng <= -50 && lat >= 25 && lat <= 70) {
    x = x - 20 // Much larger west shift to get off coast and center properly
    y = y + 8 // Shift south to position USA correctly
  }
  
  // United States specific adjustments
  if (lng >= -125 && lng <= -65 && lat >= 25 && lat <= 50) {
    x = x - 30 // Much larger west shift for USA (move significantly to the left to center)
    y = y + 2 // Additional south shift for USA
  }
  
  // Europe adjustments
  if (lng >= -10 && lng <= 40 && lat >= 35 && lat <= 70) {
    x = x - 8 // Shift west to center in Europe
    y = y - 2 // Shift north to position correctly in Europe
  }
  
  // Southern Europe adjustments (Italy, Spain, Portugal, Greece)
  if (lng >= -10 && lng <= 25 && lat >= 35 && lat <= 47) {
    x = x - 6 // Additional west shift for Southern Europe
    y = y + 2 // Shift south for Southern Europe
  }
  
  // Eastern Europe adjustments
  if (lng >= 10 && lng <= 30 && lat >= 45 && lat <= 60) {
    x = x - 5 // Additional west shift for Eastern Europe
    y = y + 2 // Shift south for Eastern Europe
  }
  
  // Northern Europe adjustments
  if (lng >= 5 && lng <= 20 && lat >= 55 && lat <= 70) {
    x = x - 10 // Increased west shift for Northern Europe
    y = y - 6 // Reduced north shift for Northern Europe (was too high)
  }
  
  // Nordic countries adjustments (Finland, Norway, Iceland)
  if (lng >= 15 && lng <= 35 && lat >= 60 && lat <= 75) {
    x = x - 8 // Additional west shift for Nordic countries
    y = y - 5 // Reduced north shift for Nordic countries (move from North Pole)
  }
  
  // Baltic countries adjustments (Lithuania, Latvia, Estonia)
  if (lng >= 20 && lng <= 30 && lat >= 53 && lat <= 60) {
    x = x - 2 // Reduced west shift for Baltic countries
    y = y + 5 // Shift south for Baltic countries (move from North Sea to Baltic)
  }
  
  // Spain specific adjustments
  if (lng >= -10 && lng <= 5 && lat >= 35 && lat <= 45) {
    x = x - 15 // Increased west shift for Spain
    y = y + 5 // Shift south for Spain
  }
  
  // Poland specific adjustments
  if (lng >= 14 && lng <= 24 && lat >= 49 && lat <= 55) {
    x = x - 10 // Shift west significantly for Poland
    y = y + 3 // Shift south for Poland
  }
  
  // Cyprus specific adjustments
  if (lng >= 32 && lng <= 35 && lat >= 34 && lat <= 36) {
    x = x - 8 // Shift west for Cyprus
    y = y - 5 // Shift north significantly for Cyprus
  }
  
  // Portugal specific adjustments
  if (lng >= -10 && lng <= -6 && lat >= 36 && lat <= 42) {
    x = x - 12 // Shift west significantly for Portugal
    y = y - 8 // Shift north significantly for Portugal
  }
  
  // Denmark specific adjustments
  if (lng >= 8 && lng <= 15 && lat >= 54 && lat <= 58) {
    x = x - 8 // Shift west for Denmark
    y = y - 3 // Reduced north shift for Denmark (was too high in the sea)
  }
  
  // Sweden specific adjustments
  if (lng >= 11 && lng <= 24 && lat >= 55 && lat <= 69) {
    x = x - 10 // Shift west significantly for Sweden
    y = y + 5 // Shift south significantly for Sweden (move from North Pole to Nordic region)
  }
  
  // Turkey specific adjustments
  if (lng >= 26 && lng <= 45 && lat >= 36 && lat <= 42) {
    x = x - 15 // Shift west significantly for Turkey
    y = y - 8 // Shift north for Turkey
  }
  
  // Finland specific adjustments
  if (lng >= 20 && lng <= 31 && lat >= 60 && lat <= 70) {
    x = x - 12 // Shift west significantly for Finland
    y = y + 3 // Shift south for Finland (move from North Pole to Nordic region)
  }
  
  // Lithuania specific adjustments
  if (lng >= 20 && lng <= 27 && lat >= 53 && lat <= 57) {
    x = x - 5 // Reduced west shift for Lithuania (move from North Sea to Baltic)
    y = y + 8 // Shift south significantly for Lithuania (move from North Sea to Baltic)
  }
  
  // Myanmar specific adjustments
  if (lng >= 92 && lng <= 101 && lat >= 9 && lat <= 29) {
    x = x - 5 // Shift west for Myanmar
    y = y + 8 // Shift south significantly for Myanmar (move from Africa to Southeast Asia)
  }
  
  // Slovakia specific adjustments
  if (lng >= 16 && lng <= 23 && lat >= 47 && lat <= 50) {
    x = x - 8 // Shift west for Slovakia
    y = y - 5 // Shift north for Slovakia
  }
  
  // United Kingdom specific adjustments
  if (lng >= -8 && lng <= 2 && lat >= 50 && lat <= 61) {
    x = x - 5 // Shift west for UK
    y = y - 15 // Increased north shift for UK (move from Africa to Europe)
  }
  
  // Slovenia specific adjustments
  if (lng >= 13 && lng <= 17 && lat >= 45 && lat <= 47) {
    x = x - 8 // Shift west for Slovenia
    y = y - 10 // Shift north significantly for Slovenia (move from Africa to Europe)
  }
  
  // Belgium specific adjustments
  if (lng >= 2 && lng <= 7 && lat >= 49 && lat <= 52) {
    x = x - 6 // Shift west for Belgium
    y = y - 8 // Shift north significantly for Belgium (move from Africa to Europe)
  }
  
  // Italy specific adjustments
  if (lng >= 6 && lng <= 19 && lat >= 35 && lat <= 47) {
    x = x - 12 // Shift west significantly for Italy (was too far right)
    y = y - 3 // Shift north slightly for Italy
  }
  
  // Asia adjustments
  if (lng >= 70 && lng <= 180 && lat >= 10 && lat <= 60) {
    x = x - 2 // Shift west to position on continent
    y = y + 2 // Shift south slightly
  }
  
  // Southeast Asia adjustments (Myanmar, Thailand, Vietnam, etc.)
  if (lng >= 90 && lng <= 120 && lat >= 5 && lat <= 25) {
    x = x - 3 // Shift west for Southeast Asia
    y = y + 5 // Shift south for Southeast Asia
  }
  
  // Western Asia adjustments
  if (lng >= 25 && lng <= 50 && lat >= 30 && lat <= 50) {
    x = x - 8 // Additional west shift for Western Asia
    y = y - 3 // Shift north for Western Asia
  }
  
  // Caucasus region adjustments (Armenia, Georgia, Azerbaijan)
  if (lng >= 40 && lng <= 50 && lat >= 38 && lat <= 42) {
    x = x - 8 // Shift west significantly to position correctly
    y = y - 2 // Shift north slightly
  }
  
  // Africa adjustments
  if (lng >= -20 && lng <= 55 && lat >= -35 && lat <= 35) {
    x = x - 2 // Shift west to position on continent
    y = y + 3 // Shift south to position correctly
  }
  
  // Australia adjustments
  if (lng >= 110 && lng <= 180 && lat >= -45 && lat <= -10) {
    x = x - 8 // Shift west significantly
    y = y + 5 // Shift south significantly
  }
  
  // South America adjustments
  if (lng >= -85 && lng <= -30 && lat >= -60 && lat <= 15) {
    x = x - 5 // Increased west shift
    y = y + 1 // Shift south slightly
  }
  
  // Ensure coordinates are within bounds
  x = Math.max(0, Math.min(mapWidth, x))
  y = Math.max(0, Math.min(mapHeight, y))
  
  return { x, y }
}

// Convert SVG coordinates to percentage for positioning
function svgToPercentage(svgX: number, svgY: number): { x: number; y: number } {
  return {
    x: (svgX / SVG_WIDTH) * 100,
    y: (svgY / SVG_HEIGHT) * 100
  }
}

// Get precise coordinates for a region
export function getPreciseCoordinates(region: string): { x: number; y: number; continent: string } {
  const geo = geographicCoordinates[region]
  if (!geo) {
    // Fallback to center of map for unknown regions
    return { x: 50, y: 50, continent: "Unknown" }
  }
  
  const svgCoords = geographicToSVG(geo.latitude, geo.longitude)
  const percentageCoords = svgToPercentage(svgCoords.x, svgCoords.y)
  
  return {
    x: Math.min(95, Math.max(5, percentageCoords.x)),
    y: Math.min(95, Math.max(5, percentageCoords.y)),
    continent: geo.continent
  }
}

// Enhanced positioning function that considers map boundaries and responsive design
export function getResponsiveCoordinates(
  region: string, 
  existingDrivers: DriverData[] = [], 
  mapContainerWidth: number = 552,
  mapContainerHeight: number = 267
): { x: number; y: number; continent: string } {
  const baseCoords = getPreciseCoordinates(region)
  
  // Adjust coordinates based on container size if different from default SVG size
  const widthRatio = mapContainerWidth / SVG_WIDTH
  const heightRatio = mapContainerHeight / SVG_HEIGHT
  
  // Scale coordinates if container size is different
  let adjustedX = baseCoords.x
  let adjustedY = baseCoords.y
  
  if (widthRatio !== 1 || heightRatio !== 1) {
    // Convert back to SVG coordinates, scale, then convert back to percentage
    const svgX = (baseCoords.x / 100) * SVG_WIDTH
    const svgY = (baseCoords.y / 100) * SVG_HEIGHT
    
    const scaledX = svgX * widthRatio
    const scaledY = svgY * heightRatio
    
    adjustedX = (scaledX / mapContainerWidth) * 100
    adjustedY = (scaledY / mapContainerHeight) * 100
  }
  
  // Check for overlapping drivers and adjust position
  const minDistance = 3 // Minimum distance between drivers (in percentage)
  const existingDriversAtRegion = existingDrivers.filter(d => 
    Math.abs(d.coordinates.x - adjustedX) < minDistance && 
    Math.abs(d.coordinates.y - adjustedY) < minDistance
  )
  
  if (existingDriversAtRegion.length > 0) {
    // Apply intelligent offset based on number of existing drivers
    const numDrivers = existingDriversAtRegion.length + 1
    
    if (numDrivers === 2) {
      adjustedX = Math.min(95, Math.max(5, adjustedX + 4))
    } else if (numDrivers === 3) {
      const angle = (numDrivers - 1) * 120 * (Math.PI / 180)
      const radius = 4
      adjustedX = Math.min(95, Math.max(5, adjustedX + Math.cos(angle) * radius))
      adjustedY = Math.min(95, Math.max(5, adjustedY + Math.sin(angle) * radius))
    } else {
      // Grid pattern for more drivers
      const gridSize = Math.ceil(Math.sqrt(numDrivers))
      const gridIndex = numDrivers - 1
      const row = Math.floor(gridIndex / gridSize)
      const col = gridIndex % gridSize
      const spacing = 3
      
      adjustedX = Math.min(95, Math.max(5, adjustedX + (col - Math.floor(gridSize / 2)) * spacing))
      adjustedY = Math.min(95, Math.max(5, adjustedY + (row - Math.floor(gridSize / 2)) * spacing))
    }
  }
  
  return {
    x: Math.min(95, Math.max(5, adjustedX)),
    y: Math.min(95, Math.max(5, adjustedY)),
    continent: baseCoords.continent
  }
}

// Test function to verify positioning accuracy (for development/debugging)
export function testPositioningAccuracy(): void {
  console.log('Testing positioning accuracy for key regions:')
  
  const testRegions = [
    'United States of America',
    'United Kingdom of Great Britain and Northern Ireland', 
    'China',
    'Australia',
    'Brazil',
    'Germany',
    'Japan',
    'India',
    'Armenia',
    'Europe'
  ]
  
  testRegions.forEach(region => {
    const coords = getPreciseCoordinates(region)
    const geo = geographicCoordinates[region]
    console.log(`${region}:`, {
      lat: geo.latitude,
      lng: geo.longitude,
      x: coords.x.toFixed(2) + '%',
      y: coords.y.toFixed(2) + '%',
      continent: coords.continent
    })
  })
}

// Legacy region coordinates for backward compatibility
export const regionCoordinates: RegionMapping = {
  "United States of America": { x: 2, y: 45, continent: "North America" },
  "Canada": { x: 8, y: 30, continent: "North America" },
  "Mexico": { x: 5, y: 50, continent: "North America" },
  "Brazil": { x: 33, y: 75, continent: "South America" },
  "Argentina": { x: 30, y: 82, continent: "South America" },
  "Chile": { x: 25, y: 85, continent: "South America" },
  "United Kingdom of Great Britain and Northern Ireland": { x: 40, y: 30, continent: "Europe" },
  "Germany": { x: 42, y: 38, continent: "Europe" },
  "France": { x: 41, y: 40, continent: "Europe" },
  "Italy": { x: 40, y: 42, continent: "Europe" },
  "Spain": { x: 35, y: 45, continent: "Europe" },
  "Poland": { x: 45, y: 40, continent: "Europe" },
  "Cyprus": { x: 48, y: 50, continent: "Europe" },
  "Portugal": { x: 38, y: 42, continent: "Europe" },
  "Denmark": { x: 42, y: 38, continent: "Europe" },
  "Sweden": { x: 45, y: 35, continent: "Europe" },
  "Turkey": { x: 50, y: 45, continent: "Asia" },
  "Finland": { x: 48, y: 33, continent: "Europe" },
  "Lithuania": { x: 48, y: 42, continent: "Europe" },
  "Myanmar": { x: 72, y: 60, continent: "Asia" },
  "Slovakia": { x: 44, y: 40, continent: "Europe" },
  "Slovenia": { x: 43, y: 42, continent: "Europe" },
  "Belgium": { x: 41, y: 38, continent: "Europe" },
  "Russia": { x: 55, y: 35, continent: "Asia" },
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
  "Armenia": { x: 52, y: 42, continent: "Asia" },
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
        
        // Use responsive coordinates for better positioning
        let coordinates = getResponsiveCoordinates(primaryRegion, drivers) || 
                         getResponsiveCoordinates(regionNames[0], drivers) || 
                         getResponsiveCoordinates("World", drivers)
        
        // Ensure coordinates are within bounds
        coordinates.x = Math.min(95, Math.max(5, coordinates.x))
        coordinates.y = Math.min(95, Math.max(5, coordinates.y))
        
        // Extract category information
        let category = "Unknown"
        if (typedDriverData.category) {
          if (typeof typedDriverData.category === 'object' && typedDriverData.category.name) {
            // Category is an object with a name property
            category = typedDriverData.category.name
          } else if (Array.isArray(typedDriverData.category) && typedDriverData.category.length > 0) {
            // Category is an array
            if (typeof typedDriverData.category[0] === 'object' && typedDriverData.category[0].name) {
              category = typedDriverData.category[0].name
            } else if (typeof typedDriverData.category[0] === 'string') {
              category = typedDriverData.category[0]
            }
          }
        }
        
        // If category is still "Unknown", try to extract from driver name
        if (category === "Unknown" && typedDriverData.driver_name) {
          const nameParts = typedDriverData.driver_name.split(',')
          if (nameParts.length > 1) {
            // Look for common category indicators in the name
            const categoryIndicators = [
              'Stearin', 'Fatty Acids', 'Volume', 'Price', 'Index', 'Rate', 'Employment',
              'Housing', 'Inventory', 'Imports', 'Exports', 'Temperature', 'Wind', 'Power',
              'Emissions', 'Chemicals', 'Manufacturing', 'Construction', 'Unemployment'
            ]
            
            for (const part of nameParts) {
              const trimmed = part.trim()
              const matchedCategory = categoryIndicators.find(indicator => 
                trimmed.includes(indicator)
              )
              if (matchedCategory) {
                category = matchedCategory
                break
              }
            }
            
            // If still no match, use the second part of the name as it often contains category info
            if (category === "Unknown" && nameParts.length > 1) {
              category = nameParts[1].trim()
            }
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
          coordinates,
          normalized_series: typedDriverData.normalized_series || null,
          rawImportance: typedDriverData.importance || null
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
