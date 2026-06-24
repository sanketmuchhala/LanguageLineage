// WCAG 2.1 compliant color contrast utilities for logo backgrounds

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
  isDarkMode: boolean
): string {
  if (!logoColor) {
    // No logo color defined - use theme-appropriate background
    return isDarkMode ? '#1c2128' : '#ffffff';
  }

  const luminance = calculateLuminance(logoColor);

  // Light logos (high luminance) need dark backgrounds
  // Dark logos (low luminance) need light backgrounds
  if (luminance > 0.5) {
    // Light logo - use dark background
    return isDarkMode ? '#1a1a1d' : '#2a2a2d';
  } else {
    // Dark logo - use light background
    return isDarkMode ? '#f4f4f5' : '#ffffff';
  }
}

// Get border color that creates subtle contrast with logo background
// Uses logo color as the border for a cohesive look
export function getLogoBorderColor(
  logoColor: string | null,
  isDarkMode: boolean
): string {
  if (!logoColor) {
    // Match theme border colors
    return isDarkMode ? '#30363d' : '#e2e5e9';
  }

  // Use the logo's dominant color as the border for cohesive branding
  return logoColor;
}
