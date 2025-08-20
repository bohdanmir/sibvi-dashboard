import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: { dataset: string } }
) {
  try {
    const { dataset } = params
    const analysesPath = join(process.cwd(), 'public', 'data', dataset, 'Analyses')
    
    // Check if the analyses directory exists
    try {
      await readdir(analysesPath)
    } catch (error) {
      return NextResponse.json(
        { error: `Dataset ${dataset} not found or no analyses available` },
        { status: 404 }
      )
    }
    
    const analysisFolders = await readdir(analysesPath, { withFileTypes: true })
    const analyses = []
    
    for (const folder of analysisFolders) {
      if (folder.isDirectory()) {
        const analysisPath = join(analysesPath, folder.name)
        const analysisContents = await readdir(analysisPath, { withFileTypes: true })
        
        // Check if this analysis has a drivers_report.json file
        const hasDriversReport = analysisContents.some(file => 
          file.isFile() && file.name === 'drivers_report.json'
        )
        
        // Check if it has an overwrite folder with drivers_report.json
        const overwritePath = join(analysisPath, 'overwrite')
        let hasOverwriteDriversReport = false
        try {
          const overwriteContents = await readdir(overwritePath, { withFileTypes: true })
          hasOverwriteDriversReport = overwriteContents.some(file => 
            file.isFile() && file.name === 'drivers_report.json'
          )
        } catch (error) {
          // Overwrite folder doesn't exist
        }
        
        if (hasDriversReport || hasOverwriteDriversReport) {
          // Try to get analysis metadata if available
          let metadata = null
          try {
            const metadataPath = join(analysisPath, 'metadata.json')
            const metadataContent = await readFile(metadataPath, 'utf-8')
            metadata = JSON.parse(metadataContent)
          } catch (error) {
            // Metadata file doesn't exist
          }
          
          analyses.push({
            id: folder.name,
            name: metadata?.name || `Analysis ${folder.name}`,
            driverCount: 0, // Will be updated when drivers are loaded
            path: `/data/${dataset}/Analyses/${folder.name}/overwrite/drivers_report.json`,
            metadata: metadata
          })
        }
      }
    }
    
    // Sort analyses by ID (numerical order)
    analyses.sort((a, b) => parseInt(a.id) - parseInt(b.id))
    
    return NextResponse.json(analyses)
  } catch (error) {
    console.error(`Error reading analyses for dataset ${params.dataset}:`, error)
    return NextResponse.json(
      { error: 'Failed to read analyses' },
      { status: 500 }
    )
  }
}
