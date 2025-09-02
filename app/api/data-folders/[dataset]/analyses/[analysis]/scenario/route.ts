import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string; analysis: string } }
) {
  try {
    const { dataset, analysis } = params
    
    // Get the path to the scenario.json file
    const scenarioPath = path.join(process.cwd(), 'public', 'data', dataset, 'Analyses', analysis, 'scenario.json')
    
    try {
      // Read the scenario file
      const fileContent = await readFile(scenarioPath, 'utf-8')
      const scenarioData = JSON.parse(fileContent)
      
      return NextResponse.json(scenarioData)
    } catch (error) {
      console.error(`Error reading scenario file for ${analysis}:`, error)
      return NextResponse.json(
        { error: 'Scenario file not found' },
        { status: 404 }
      )
    }
    
  } catch (error) {
    console.error('Error reading scenario data:', error)
    return NextResponse.json(
      { error: 'Failed to read scenario data' },
      { status: 500 }
    )
  }
}
