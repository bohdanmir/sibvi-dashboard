"use client"

import { useState, useEffect } from 'react'

interface LinkPreviewData {
  title?: string
  description?: string
  image?: string
  url: string
}

interface LinkPreviewProps {
  url: string
  className?: string
  fallbackTitle?: string
}

export function LinkPreview({ url, className = "", fallbackTitle }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true)
        setError(false)
        
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch preview')
        }
        
        const data = await response.json()
        setPreview(data)
      } catch (err) {
        console.error('Error fetching link preview:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [url])

  if (loading) {
    return (
      <div className={`w-16 h-16 rounded-md bg-muted flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className={`w-16 h-16 rounded-md bg-muted flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">
          {fallbackTitle ? fallbackTitle.charAt(0).toUpperCase() : 'L'}
        </span>
      </div>
    )
  }

  return (
    <div className={`w-16 h-16 rounded-md overflow-hidden bg-muted ${className}`}>
      {preview.image ? (
        <img 
          src={preview.image} 
          alt={preview.title || fallbackTitle || 'Link preview'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to no image state if image fails to load
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling as HTMLElement
            if (fallback) fallback.style.display = 'flex'
          }}
        />
      ) : null}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ display: preview.image ? 'none' : 'flex' }}
      >
        <span className="text-xs text-muted-foreground text-center px-1">
          {preview.title ? preview.title.charAt(0).toUpperCase() : 
           fallbackTitle ? fallbackTitle.charAt(0).toUpperCase() : 'L'}
        </span>
      </div>
    </div>
  )
}
