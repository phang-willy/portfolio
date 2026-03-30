'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Theme } from '@/features/theme/types/theme.types'
import { getSystemTheme, getStoredTheme, THEME_KEY } from "@/features/theme/utils/theme.utils";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return getStoredTheme()
  })

  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  )

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    const applied =
      theme === 'system' ? getSystemTheme() : theme

    root.classList.remove('light', 'dark')
    root.classList.add(applied)

    localStorage.setItem(THEME_KEY, theme)
  }, [theme, mounted])

  return { theme, setTheme, mounted }
}
