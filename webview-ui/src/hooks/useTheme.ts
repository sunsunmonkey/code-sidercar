/**
 * React hook for VSCode theme management
 * Provides theme detection and change notifications
 * Requirements: 3.5
 */

import { useState, useEffect } from 'react';
import { detectThemeKind, onThemeChange, type ThemeKind } from '../utils/theme';

/**
 * Hook that returns the current VSCode theme kind and updates on theme changes
 */
export function useTheme(): ThemeKind {
  const [themeKind, setThemeKind] = useState<ThemeKind>(detectThemeKind());

  useEffect(() => {
    // Listen for theme changes
    const cleanup = onThemeChange((newTheme) => {
      setThemeKind(newTheme);
    });

    return cleanup;
  }, []);

  return themeKind;
}
