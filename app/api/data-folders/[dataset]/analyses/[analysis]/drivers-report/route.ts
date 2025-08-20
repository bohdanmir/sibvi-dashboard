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
    
    // Extract all unique categories from the drivers report
    const categories = new Map<number, string>()
    
    // Iterate through all driver entries
    Object.values(driversReport).forEach((driver: unknown) => {
      if (driver && typeof driver === 'object' && driver !== null) {
        const driverObj = driver as Record<string, unknown>
        if (driverObj.category && typeof driverObj.category === 'object' && driverObj.category !== null) {
          const category = driverObj.category as Record<string, unknown>
          if (typeof category.id === 'number' && typeof category.name === 'string') {
            categories.set(category.id, category.name)
          }
        }
      }
    })
    
    // Convert to array format
    const categoriesArray = Array.from(categories.entries()).map(([id, name]) => ({
      id,
      name
    }))
    
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
