export const IconMic = ({ muted }: { muted?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M5 11a7 7 0 0 0 14 0M12 18v3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {muted ? (
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ) : null}
  </svg>
);

export const IconCam = ({ off }: { off?: boolean }) => (
  <svg width="18" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M16 10l4-3v10l-4-3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {off ? (
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ) : null}
  </svg>
);

export const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4v10M8 8l4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4v-4H7a3 3 0 0 1-3-3V6Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPeople = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11Zm-9 9a4 4 0 0 1 8 0M14 20a4 4 0 0 1 6 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IconApps = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconEnd = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12a8 8 0 0 1 16 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M7 12v4M17 12v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IconUser = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M4 20a8 8 0 0 1 16 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
