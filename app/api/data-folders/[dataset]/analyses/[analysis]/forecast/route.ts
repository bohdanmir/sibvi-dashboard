import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Quantile finder function to calculate quantiles from samples
function quantileFinder(samples: number[], quantile: number): number {
  const p = quantile / 100;
  const index = (samples.length - 1) * p;
  return samples[Math.round(index)];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string; analysis: string } }
) {
  try {
    const { dataset, analysis } = params
    
    // Construct the path to the forecast JSON file
    const filePath = path.join(process.cwd(), 'public', 'data', dataset, 'Analyses', analysis, 'forecast.json')
    
    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const forecastData = JSON.parse(fileContent)
    
    // Extract forecast values from the forecast_series
    // Handle both direct forecast_series and nested data.forecast_series structures
    const forecastSeries = forecastData.forecast_series || forecastData.data?.forecast_series
    
    if (forecastSeries && typeof forecastSeries === 'object') {
      const forecastValues: number[] = []
      const dates: string[] = []
      const allQuantiles: Record<string, (number | null)[]> = {}
      const allSamples: Record<string, number[][]> = {}
      
      // Sort dates and extract forecast values
      Object.entries(forecastSeries)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .forEach(([date, data]) => {
          if (data && typeof data === 'object' && 'forecast' in data) {
            const forecastValue = (data as { forecast: number }).forecast
            if (typeof forecastValue === 'number') {
              dates.push(date)
              forecastValues.push(forecastValue)
              
              // Extract forecast samples if available
              const samples = (data as any).forecast_samples
              if (samples && Array.isArray(samples)) {
                // Sort samples for accurate quantile calculation
                const sortedSamples = [...samples].sort((a, b) => a - b)
                allSamples[date] = sortedSamples
                
                // Calculate quantiles from samples if quantile_forecast is not available
                const quantileData = (data as any).quantile_forecast
                if (quantileData && typeof quantileData === 'object') {
                  // Use existing quantile_forecast data
                  Object.entries(quantileData).forEach(([quantileKey, quantileValue]) => {
                    if (typeof quantileValue === 'number') {
                      if (!allQuantiles[quantileKey]) {
                        allQuantiles[quantileKey] = new Array(dates.length - 1).fill(null)
                      }
                      allQuantiles[quantileKey].push(quantileValue)
                    }
                  })
                } else {
                  // Calculate quantiles from samples
                  const quantileLevels = [5, 15, 25, 50, 75, 85, 95]
                  quantileLevels.forEach(level => {
                    const quantileKey = (level / 100).toString()
                    if (!allQuantiles[quantileKey]) {
                      allQuantiles[quantileKey] = new Array(dates.length - 1).fill(null)
                    }
                    allQuantiles[quantileKey].push(quantileFinder(sortedSamples, level))
                  })
                }
              } else {
                // Extract all available quantile values dynamically
                const quantileData = (data as any).quantile_forecast
                if (quantileData && typeof quantileData === 'object') {
                  Object.entries(quantileData).forEach(([quantileKey, quantileValue]) => {
                    if (typeof quantileValue === 'number') {
                      if (!allQuantiles[quantileKey]) {
                        allQuantiles[quantileKey] = new Array(dates.length - 1).fill(null)
                      }
                      allQuantiles[quantileKey].push(quantileValue)
                    }
                  })
                }
              }
              
              // Fill null for any quantiles that don't have data for this date
              Object.keys(allQuantiles).forEach(quantileKey => {
                if (allQuantiles[quantileKey].length < dates.length) {
                  allQuantiles[quantileKey].push(null)
                }
              })
            }
          }
        })
      
      // Sort quantile keys numerically for consistent ordering
      const sortedQuantileKeys = Object.keys(allQuantiles).sort((a, b) => parseFloat(a) - parseFloat(b))
      
      return NextResponse.json({
        forecastValues,
        dates,
        allQuantiles,
        sortedQuantileKeys,
        allSamples,
        totalPoints: forecastValues.length
      })
    }
    
    return NextResponse.json({
      forecastValues: [],
      dates: [],
      totalPoints: 0
    })
    
  } catch (error) {
    console.error('Error reading forecast data:', error)
    return NextResponse.json(
      { error: 'Failed to read forecast data' },
      { status: 500 }
    )
  }
}
