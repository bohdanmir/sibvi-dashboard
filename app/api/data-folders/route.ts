import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'public', 'data')
    const items = await readdir(dataPath, { withFileTypes: true })
    
    // Filter only directories and return their names
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => ({
        title: item.name,
        url: `#${item.name}`,
        icon: 'folder'
      }))
    
    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error reading data directory:', error)
    return NextResponse.json(
      { error: 'Failed to read data directory' },
      { status: 500 }
    )
  }
}
