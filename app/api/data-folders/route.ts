import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'public', 'data')
    const items = await readdir(dataPath, { withFileTypes: true })
    
    // Filter only directories and get their contents
    const folders = []
    
    for (const item of items) {
      if (item.isDirectory()) {
        const folderPath = join(dataPath, item.name)
        const folderContents = await readdir(folderPath, { withFileTypes: true })
        
        // Get CSV files in the folder
        const csvFiles = folderContents
          .filter(file => file.isFile() && file.name.endsWith('.csv'))
          .map(file => file.name)
        
        // Try to read description file
        let description = null
        try {
          const descPath = join(folderPath, 'desc', 'description.json')
          const descContent = await readFile(descPath, 'utf-8')
          description = JSON.parse(descContent)
        } catch (error) {
          // Description file doesn't exist or can't be read
          console.log(`No description file found for ${item.name}`)
        }
        
        folders.push({
          title: item.name,
          url: `#${item.name}`,
          icon: 'folder',
          files: csvFiles,
          description: description
        })
      }
    }
    
    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error reading data directory:', error)
    return NextResponse.json(
      { error: 'Failed to read data directory' },
      { status: 500 }
    )
  }
}
