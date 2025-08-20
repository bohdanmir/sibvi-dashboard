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
    
    // Find the first object with a driver_name field
    let firstDriverName = "Driver Name Unavailable"
    
    for (const key in data) {
      if (data[key] && typeof data[key] === 'object' && data[key].driver_name) {
        firstDriverName = data[key].driver_name
        break
      }
    }
    
    return NextResponse.json({ driverName: firstDriverName })
  } catch (error) {
    console.error('Error reading drivers report:', error)
    return NextResponse.json(
      { error: 'Failed to read drivers report' },
      { status: 500 }
    )
  }
}
