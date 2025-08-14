import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
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
        
        folders.push({
          title: item.name,
          url: `#${item.name}`,
          icon: 'folder',
          files: csvFiles
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
