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

    // If no OpenGraph image found, try to extract images from page content
    if (!preview.image) {
      // Look for images in the main content area, excluding common non-content images
      const contentImages = $('img').filter((i, el) => {
        const $img = $(el)
        const src = $img.attr('src')
        const alt = $img.attr('alt') || ''
        const className = $img.attr('class') || ''
        
        // Skip common non-content images
        if (!src || 
            src.includes('logo') || 
            src.includes('icon') || 
            src.includes('avatar') ||
            src.includes('profile') ||
            src.includes('banner') ||
            src.includes('header') ||
            src.includes('footer') ||
            src.includes('advertisement') ||
            src.includes('ad-') ||
            src.includes('favicon') ||
            src.includes('webassets') ||
            className.includes('logo') ||
            className.includes('icon') ||
            className.includes('avatar') ||
            className.includes('banner') ||
            className.includes('header') ||
            className.includes('footer') ||
            className.includes('ad') ||
            className.includes('favicon') ||
            alt.toLowerCase().includes('logo') ||
            alt.toLowerCase().includes('icon') ||
            alt.toLowerCase().includes('avatar') ||
            alt.toLowerCase().includes('banner') ||
            alt.toLowerCase().includes('header') ||
            alt.toLowerCase().includes('footer') ||
            alt.toLowerCase().includes('advertisement') ||
            alt.toLowerCase().includes('favicon')) {
          return false
        }
        
        // Skip very small images (likely icons/logos)
        const width = parseInt($img.attr('width') || '0')
        const height = parseInt($img.attr('height') || '0')
        if (width > 0 && height > 0 && (width < 100 || height < 100)) {
          return false
        }
        
        // Prefer images that are likely content images (have meaningful alt text or are in content areas)
        return true
      })
      
      // Get the first suitable image
      if (contentImages.length > 0) {
        const firstImage = contentImages.first()
        const imageSrc = firstImage.attr('src')
        if (imageSrc) {
          preview.image = imageSrc
        }
      }
    }

    // Clean up image URL - make it absolute if it's relative
    if (preview.image) {
      try {
        // Remove any query parameters or fragments that might cause issues
        const cleanImageUrl = preview.image.split('?')[0].split('#')[0]
        const absoluteImageUrl = new URL(cleanImageUrl, url).href
        
        // Check if the image is likely a logo (even if it's from OpenGraph)
        const imageUrlLower = absoluteImageUrl.toLowerCase()
        const isLogo = imageUrlLower.includes('logo') || 
                      imageUrlLower.includes('icon') || 
                      imageUrlLower.includes('avatar') ||
                      imageUrlLower.includes('profile') ||
                      imageUrlLower.includes('banner') ||
                      imageUrlLower.includes('header') ||
                      imageUrlLower.includes('footer') ||
                      imageUrlLower.includes('favicon') ||
                      imageUrlLower.includes('webassets')
        
        if (isLogo) {
          // If the OpenGraph image is a logo, try to find a better image from page content
          const contentImages = $('img').filter((i, el) => {
            const $img = $(el)
            const src = $img.attr('src')
            const alt = $img.attr('alt') || ''
            const className = $img.attr('class') || ''
            
            // Skip common non-content images
            if (!src || 
                src.includes('logo') || 
                src.includes('icon') || 
                src.includes('avatar') ||
                src.includes('profile') ||
                src.includes('banner') ||
                src.includes('header') ||
                src.includes('footer') ||
                src.includes('advertisement') ||
                src.includes('ad-') ||
                src.includes('favicon') ||
                src.includes('webassets') ||
                className.includes('logo') ||
                className.includes('icon') ||
                className.includes('avatar') ||
                className.includes('banner') ||
                className.includes('header') ||
                className.includes('footer') ||
                className.includes('ad') ||
                className.includes('favicon') ||
                alt.toLowerCase().includes('logo') ||
                alt.toLowerCase().includes('icon') ||
                alt.toLowerCase().includes('avatar') ||
                alt.toLowerCase().includes('banner') ||
                alt.toLowerCase().includes('header') ||
                alt.toLowerCase().includes('footer') ||
                alt.toLowerCase().includes('advertisement') ||
                alt.toLowerCase().includes('favicon')) {
              return false
            }
            
            // Skip very small images (likely icons/logos)
            const width = parseInt($img.attr('width') || '0')
            const height = parseInt($img.attr('height') || '0')
            if (width > 0 && height > 0 && (width < 100 || height < 100)) {
              return false
            }
            
            return true
          })
          
          // Use the first suitable content image instead of the logo
          if (contentImages.length > 0) {
            const firstImage = contentImages.first()
            const imageSrc = firstImage.attr('src')
            if (imageSrc) {
              preview.image = new URL(imageSrc, url).href
            } else {
              preview.image = undefined
            }
          } else {
            preview.image = undefined
          }
        } else {
          preview.image = absoluteImageUrl
        }
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
