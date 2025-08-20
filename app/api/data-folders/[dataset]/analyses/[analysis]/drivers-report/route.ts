import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string; analysis: string } }
) {
  try {
    const { dataset, analysis } = params
    
    // Construct the path to the drivers report JSON file
    const filePath = path.join(process.cwd(), 'public', 'data', dataset, 'Analyses', analysis, 'overwrite', 'drivers_report.json')
    
    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const driversReport = JSON.parse(fileContent)
    
    // Extract all unique categories with their importance values from the drivers report
    const categories = new Map<number, { name: string; importance: number }>()
    
    // Iterate through all driver entries
    Object.values(driversReport).forEach((driver: unknown) => {
      if (driver && typeof driver === 'object' && driver !== null) {
        const driverObj = driver as Record<string, unknown>
        
        // Extract category information
        if (driverObj.category && typeof driverObj.category === 'object' && driverObj.category !== null) {
          const category = driverObj.category as Record<string, unknown>
          if (typeof category.id === 'number' && typeof category.name === 'string') {
            
            // Extract importance value
            let importance = 0
            if (driverObj.importance && typeof driverObj.importance === 'object' && driverObj.importance !== null) {
              const importanceObj = driverObj.importance as Record<string, unknown>
              if (importanceObj.overall && typeof importanceObj.overall === 'object' && importanceObj.overall !== null) {
                const overall = importanceObj.overall as Record<string, unknown>
                if (typeof overall.mean === 'number') {
                  importance = Math.round(overall.mean) // Round to whole percentage
                }
              }
            }
            
            // Only add if we have both category and importance data
            if (importance > 0) {
              categories.set(category.id, { name: category.name, importance })
            }
          }
        }
      }
    })
    
    // Convert to array format and sort by category ID
    const categoriesArray = Array.from(categories.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        importance: data.importance
      }))
      .sort((a, b) => a.id - b.id) // Sort by category ID ascending
    
    return NextResponse.json({
      categories: categoriesArray,
      totalDrivers: Object.keys(driversReport).length,
      categoriesCount: categoriesArray.length
    })
    
  } catch (error) {
    console.error('Error reading drivers report:', error)
    return NextResponse.json(
      { error: 'Failed to read drivers report' },
      { status: 500 }
    )
  }
}
