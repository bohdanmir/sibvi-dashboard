import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string } }
) {
  try {
    const { dataset } = params
    
    // Get the path to the dataset's Analyses folder
    const analysesPath = path.join(process.cwd(), 'public', 'data', dataset, 'Analyses')
    
    // Read all analysis folders
    const analysisFolders = await fs.readdir(analysesPath)
    
    // Set to store all unique categories across all analyses
    const allCategories = new Map<number, string>()
    
    // Iterate through each analysis folder
    for (const folder of analysisFolders) {
      const driversReportPath = path.join(analysesPath, folder, 'overwrite', 'drivers_report.json')
      
      try {
        // Try to read the drivers report for this analysis
        const fileContent = await fs.readFile(driversReportPath, 'utf-8')
        const driversReport = JSON.parse(fileContent)
        
        // Extract categories from this analysis
        Object.values(driversReport).forEach((driver: unknown) => {
          if (driver && typeof driver === 'object' && driver !== null) {
            const driverObj = driver as Record<string, unknown>
            if (driverObj.category && typeof driverObj.category === 'object' && driverObj.category !== null) {
              const category = driverObj.category as Record<string, unknown>
              if (typeof category.id === 'number' && typeof category.name === 'string') {
                allCategories.set(category.id, category.name)
              }
            }
          }
        })
      } catch (error) {
        // Skip analyses that don't have drivers_report.json
        console.log(`Skipping analysis ${folder}: ${error}`)
        continue
      }
    }
    
    // Convert to sorted array
    const categoriesArray = Array.from(allCategories.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id - b.id)
    
    return NextResponse.json({
      categories: categoriesArray,
      totalCategories: categoriesArray.length
    })
    
  } catch (error) {
    console.error('Error reading dataset categories:', error)
    return NextResponse.json(
      { error: 'Failed to read dataset categories' },
      { status: 500 }
    )
  }
}
