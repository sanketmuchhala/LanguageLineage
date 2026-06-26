// WCAG 2.1 compliant color contrast utilities for logo backgrounds
import type { LogoSurface } from '../data/logoMap';

// Calculate relative luminance per WCAG 2.1 specification
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
export function calculateLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Get logo background color - provide contrasting background for visibility
// Uses luminance of logo color to decide light vs dark background
export function getAdaptiveLogoBackground(
  logoColor: string | null,
  isDarkMode: boolean,
  logoSurface: LogoSurface = 'dark'
): string {
  if (logoSurface === 'soft-light') {
    return isDarkMode ? '#e8edf3' : '#ffffff';
  }

  if (!logoColor) {
    // No logo color defined - use theme-appropriate background
    return isDarkMode ? '#111820' : '#ffffff';
  }

  const luminance = calculateLuminance(logoColor);

  if (isDarkMode) {
    return luminance > 0.5 ? '#0d1117' : '#111820';
  }

  // In light mode, only light logos need a dark stage for contrast.
  if (luminance > 0.5) {
    return '#2a2a2d';
  }

  return '#ffffff';
}

// Get border color that creates subtle contrast with logo background
// Uses logo color as the border for a cohesive look
export function getLogoBorderColor(
  logoColor: string | null,
  isDarkMode: boolean,
  logoSurface: LogoSurface = 'dark'
): string {
  if (logoSurface === 'soft-light') {
    return isDarkMode ? '#c7d0dd' : '#d8dee8';
  }

  if (!logoColor) {
    // Match theme border colors
    return isDarkMode ? '#2b3440' : '#e2e5e9';
  }

  // Use the logo's dominant color as the border for cohesive branding
  return logoColor;
}
