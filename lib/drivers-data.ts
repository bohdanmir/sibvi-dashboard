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

export async function fetchDriversData(): Promise<DriverData[]> {
  try {
    // Fetch from the MB 301 analysis dataset
    const response = await fetch('/data/MB 301/Analyses/8095/overwrite/drivers_report.json')
    if (!response.ok) {
      throw new Error('Failed to fetch drivers data')
    }
    
    const data = await response.json()
    const drivers: DriverData[] = []
    
    for (const [id, driverData] of Object.entries(data)) {
      const typedDriverData = driverData as any
      if (typedDriverData.driver_name && typedDriverData.region && typedDriverData.region.length > 0) {
        const regionNames = typedDriverData.region.map((r: any) => r.name)
        const primaryRegion = regionNames[regionNames.length - 1] // Get the most specific region
        
        const coordinates = regionCoordinates[primaryRegion] || regionCoordinates[regionNames[0]] || regionCoordinates["World"]
        
        drivers.push({
          id,
          name: typedDriverData.driver_name,
          region: regionNames,
          category: typedDriverData.category?.name || "Unknown",
          isPublic: typedDriverData.is_public || false,
          importance: typedDriverData.importance?.overall?.mean || 0,
          direction: typedDriverData.direction?.overall?.mean || 0,
          lag: typedDriverData.overall_lag || "Unknown",
          coordinates
        })
      }
    }
    
    return drivers
  } catch (error) {
    console.error('Error fetching drivers data:', error)
    return []
  }
}
