export const palette = {
  primary: '#8FA963',
  primaryDark: '#4A5D23',
  secondary: '#C2D5A8',
  background: '#F7F9F2',
  panel: '#ffffff',
  border: '#E9F0DF',
  text: '#4A5D23',
  textMuted: '#64748b',
  textSoft: '#94a3b8',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  dangerBorder: '#fca5a5',
  warning: '#f59e0b',
  warningSoft: '#fff7ed',
  success: '#22c55e',
  successSoft: '#ecfdf5',
  successDark: '#059669',
  soft: '#F0F5E8',
};

export const shadows = {
  card: '0 1px 3px rgba(15, 23, 42, 0.08)',
  floating: '0 2px 8px rgba(15, 23, 42, 0.12)',
  deep: '0 10px 30px rgba(15, 23, 42, 0.18)',
  raised: '0 6px 16px rgba(15, 23, 42, 0.08)',
  lifted: '0 6px 18px rgba(15, 23, 42, 0.08)',
  dangerGlow: '0 10px 30px rgba(220, 38, 38, 0.1)',
  dangerStrong: '0 10px 30px rgba(220, 38, 38, 0.18)',
};

export const overlays = {
  scrim: 'rgba(15, 23, 42, 0.4)',
};

type RGB = { r: number; g: number; b: number };

const hexToRgb = (hex: string): RGB => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char + char)
          .join('')
      : normalized;
  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const channelToLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

export const getContrastRatio = (foreground: string, background: string) => {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const fgLuminance =
    0.2126 * channelToLinear(fg.r) +
    0.7152 * channelToLinear(fg.g) +
    0.0722 * channelToLinear(fg.b);
  const bgLuminance =
    0.2126 * channelToLinear(bg.r) +
    0.7152 * channelToLinear(bg.g) +
    0.0722 * channelToLinear(bg.b);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};
