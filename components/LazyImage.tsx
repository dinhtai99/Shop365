/**
 * Optimized Image component with lazy loading
 * Wrapper around next/image with additional optimizations
 */

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface LazyImageProps extends Omit<ImageProps, 'loading'> {
  fallback?: string
  priority?: boolean
}

export default function LazyImage({
  src,
  alt,
  fallback = '/placeholder-product.jpg',
  priority = false,
  className = '',
  ...props
}: LazyImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallback)
          setIsLoading(false)
        }}
        {...props}
      />
    </div>
  )
}
