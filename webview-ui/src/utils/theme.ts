/**
 * Theme utilities for VSCode webview
 * Detects and manages theme changes for proper UI adaptation
 * 
 * This module provides:
 * - Theme detection based on VSCode's data-vscode-theme-kind attribute
 * - Fallback detection using background color brightness analysis
 * - Theme change monitoring via MutationObserver
 * - Dynamic syntax highlighter theme selection
 * 
 * The theme system ensures that:
 * - All UI elements adapt to VSCode's current theme (light/dark/high-contrast)
 * - Code syntax highlighting matches the editor theme
 * - Theme changes are detected and applied in real-time
 * - Proper fallbacks exist for all theme-dependent colors
 * 
 * Requirements: 3.5 - VSCode theme adaptation
 * 
 * @module theme
 */

export type ThemeKind = 'light' | 'dark' | 'high-contrast';

/**
 * Detects the current VSCode theme kind based on CSS variables
 */
export function detectThemeKind(): ThemeKind {
  // VSCode sets a data-vscode-theme-kind attribute on the body
  const themeKind = document.body.getAttribute('data-vscode-theme-kind');
  
  if (themeKind === 'vscode-light') {
    return 'light';
  } else if (themeKind === 'vscode-high-contrast') {
    return 'high-contrast';
  }
  
  // Fallback: check background color brightness
  const bgColor = getComputedStyle(document.body).backgroundColor;
  const brightness = getColorBrightness(bgColor);
  
  return brightness > 128 ? 'light' : 'dark';
}

/**
 * Calculates the brightness of a color (0-255)
 */
function getColorBrightness(color: string): number {
  // Parse rgb/rgba color
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  // Calculate perceived brightness using standard formula
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Listens for theme changes and calls the callback
 */
export function onThemeChange(callback: (theme: ThemeKind) => void): () => void {
  let currentTheme = detectThemeKind();
  
  // Watch for attribute changes on body
  const observer = new MutationObserver(() => {
    const newTheme = detectThemeKind();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      callback(newTheme);
    }
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-vscode-theme-kind', 'class', 'style'],
  });
  
  // Also watch for CSS variable changes
  const styleObserver = new MutationObserver(() => {
    const newTheme = detectThemeKind();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      callback(newTheme);
    }
  });
  
  const style = document.querySelector('style');
  if (style) {
    styleObserver.observe(style, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    styleObserver.disconnect();
  };
}

/**
 * Gets the appropriate syntax highlighter theme for the current VSCode theme
 */
export function getSyntaxHighlighterTheme(themeKind: ThemeKind) {
  // Import themes dynamically based on theme kind
  if (themeKind === 'light') {
    return import('react-syntax-highlighter/dist/esm/styles/prism').then(
      (module) => module.vs
    );
  } else {
    return import('react-syntax-highlighter/dist/esm/styles/prism').then(
      (module) => module.vscDarkPlus
    );
  }
}
