type IconProps = { size?: number; strokeWidth?: number };

export const AlertTriangleIcon = ({
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <path
      d="M12 9v4M12 17h.01"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

export const CheckCircleIcon = ({
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m9 11 3 3L22 4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LinkOffIcon = ({
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="m2 2 20 20M10 14l-2 2a4 4 0 1 1-5.66-5.66l3-3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m14 10 2-2a4 4 0 0 1 5.66 5.66l-3 3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RefreshIcon = ({
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 2v6h6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12A9 9 0 0 0 5.64 5.64L3 8M21 22v-6h-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 12a9 9 0 0 0 15.36 6.36L21 16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = ({
  size = 18,
  strokeWidth = 2,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
    <path
      d="m21 21-4.35-4.35"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

export const UsersIcon = ({
  size = 32,
  strokeWidth = 1.6,
  color = 'currentColor',
}: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="17" cy="11" r="3" stroke={color} strokeWidth={strokeWidth} />
    <path
      d="M21 21v-1.5a3 3 0 0 0-3-3h-.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);
