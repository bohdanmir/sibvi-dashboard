import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface LinkPreview {
  title?: string
  description?: string
  image?: string
  url: string
}

// Simple in-memory cache (in production, you might want to use Redis or similar)
const cache = new Map<string, { data: LinkPreview; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Validate URL
    const urlObj = new URL(url)
    
    // Check cache first
    const cached = cache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }
    
    // Fetch the webpage with multiple user agents to avoid blocking
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ]
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract metadata with more comprehensive selectors
    const preview: LinkPreview = {
      url: url,
      title: $('meta[property="og:title"]').attr('content') || 
             $('meta[name="twitter:title"]').attr('content') ||
             $('meta[name="title"]').attr('content') ||
             $('title').text() ||
             undefined,
      description: $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="twitter:description"]').attr('content') ||
                   $('meta[name="description"]').attr('content') ||
                   $('meta[property="description"]').attr('content') ||
                   undefined,
      image: $('meta[property="og:image"]').attr('content') || 
             $('meta[name="twitter:image"]').attr('content') ||
             $('meta[name="twitter:image:src"]').attr('content') ||
             $('meta[property="twitter:image"]').attr('content') ||
             undefined,
    }

    // Clean up image URL - make it absolute if it's relative
    if (preview.image) {
      try {
        // Remove any query parameters or fragments that might cause issues
        const cleanImageUrl = preview.image.split('?')[0].split('#')[0]
        preview.image = new URL(cleanImageUrl, url).href
      } catch {
        // If URL construction fails, remove the image
        preview.image = undefined
      }
    }

    // Clean up title and description
    if (preview.title) {
      preview.title = preview.title.trim().replace(/\s+/g, ' ')
    }
    if (preview.description) {
      preview.description = preview.description.trim().replace(/\s+/g, ' ')
    }

    // Cache the result
    cache.set(url, { data: preview, timestamp: Date.now() })

    return NextResponse.json(preview)

  } catch (error) {
    console.error('Error fetching link preview for URL:', url, error)
    
    // Return a fallback response instead of error
    const fallback: LinkPreview = {
      url: url,
      title: undefined,
      description: undefined,
      image: undefined
    }
    
    return NextResponse.json(fallback)
  }
}
