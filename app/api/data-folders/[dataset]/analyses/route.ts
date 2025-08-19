import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: { dataset: string } }
) {
  try {
    const { dataset } = params
    const analysesPath = join(process.cwd(), 'public', 'data', dataset, 'Analyses')
    
    // Check if Analyses directory exists
    try {
      const analysesFolders = await readdir(analysesPath, { withFileTypes: true })
      
      // Filter only directories and get their basic info
      const folders = analysesFolders
        .filter(item => item.isDirectory())
        .map(folder => ({
          id: folder.name,
          name: `Analysis ${folder.name}`,
          path: `${dataset}/Analyses/${folder.name}`
        }))
      
      return NextResponse.json(folders)
    } catch (error) {
      // Analyses directory doesn't exist
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error reading analyses directory:', error)
    return NextResponse.json(
      { error: 'Failed to read analyses directory' },
      { status: 500 }
    )
  }
}
