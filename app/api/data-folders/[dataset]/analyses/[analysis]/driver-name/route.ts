import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string; analysis: string } }
) {
  try {
    const { dataset, analysis } = params
    
    // Construct the path to the drivers_report.json file
    const filePath = path.join(process.cwd(), 'public', 'data', dataset, 'Analyses', analysis, 'overwrite', 'drivers_report.json')
    
    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Find the first object with a category field
    let firstCategoryName = "Category Name Unavailable"
    
    for (const key in data) {
      if (data[key] && typeof data[key] === 'object' && data[key].category && data[key].category.name) {
        firstCategoryName = data[key].category.name
        break
      }
    }
    
    return NextResponse.json({ categoryName: firstCategoryName })
  } catch (error) {
    console.error('Error reading drivers report:', error)
    return NextResponse.json({ categoryName: "Category Name Unavailable" }, { status: 500 })
  }
}
