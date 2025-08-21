import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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
    if (forecastData.forecast_series && typeof forecastData.forecast_series === 'object') {
      const forecastValues: number[] = []
      const dates: string[] = []
      
      // Sort dates and extract forecast values
      Object.entries(forecastData.forecast_series)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .forEach(([date, data]) => {
          if (data && typeof data === 'object' && 'forecast' in data) {
            const forecastValue = (data as { forecast: number }).forecast
            if (typeof forecastValue === 'number') {
              dates.push(date)
              forecastValues.push(forecastValue)
            }
          }
        })
      
      return NextResponse.json({
        forecastValues,
        dates,
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
