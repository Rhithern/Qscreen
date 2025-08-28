'use client'

import { ReactNode, useEffect } from 'react'
import { useTenant } from '@/lib/tenant-context'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const tenant = useTenant()

  useEffect(() => {
    // Update CSS variables when theme changes
    const root = document.documentElement
    const { colors } = tenant.theme

    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-hover', adjustColor(colors.primary, -10))
    root.style.setProperty('--color-primary-foreground', getContrastColor(colors.primary))
    
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-foreground', colors.text)

    // Generate complementary colors
    root.style.setProperty('--color-muted', adjustColor(colors.text, 40))
    root.style.setProperty('--color-muted-foreground', getContrastColor(adjustColor(colors.text, 40)))
    
    root.style.setProperty('--color-border', adjustColor(colors.text, 80))
    root.style.setProperty('--color-input', adjustColor(colors.background, -5))

  }, [tenant.theme])

  return children
}

// Helper functions for color manipulation

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount

  r = Math.min(Math.max(0, r), 255)
  g = Math.min(Math.max(0, g), 255)
  b = Math.min(Math.max(0, b), 255)

  return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')
}

function getContrastColor(hexcolor: string): string {
  const hex = hexcolor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? '#000000' : '#ffffff'
}