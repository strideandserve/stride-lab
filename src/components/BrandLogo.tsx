'use client'
import { useState } from 'react'
import { getBrandLogoUrl } from '@/lib/utils'

interface Props { brand: string; size?: number }

export default function BrandLogo({ brand, size = 34 }: Props) {
  const [failed, setFailed] = useState(false)
  const url = getBrandLogoUrl(brand)
  const initials = (brand || '?').substring(0, 2).toUpperCase()

  if (!url || failed) {
    return (
      <div style={{
        width: size, height: size, background: 'var(--surface2)',
        border: '1px solid var(--border)', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
        color: 'var(--text-muted)', flexShrink: 0,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={brand}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.75, flexShrink: 0 }}
    />
  )
}
