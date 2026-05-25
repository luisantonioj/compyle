// compyle — SVG icon library

interface IconProps { size?: number; stroke?: string; fill?: string; }

export const Icons = {
  check: ({ size = 14, stroke = '#fff' }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: ({ size = 20, stroke = '#fff' }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  chevR: ({ size, stroke = 'currentColor' }: IconProps = {}) => (
    <svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <path d="M1 1L7 7L1 13" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevL: ({ size, stroke = 'currentColor' }: IconProps = {}) => (
    <svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <path d="M7 1L1 7L7 13" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  eye: ({ stroke = 'currentColor' }: IconProps = {}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke={stroke} strokeWidth="1.4"/>
      <circle cx="8" cy="8" r="2" stroke={stroke} strokeWidth="1.4"/>
    </svg>
  ),
  eyeOff: ({ stroke = 'currentColor' }: IconProps = {}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M5.5 5.5a3 3 0 014 4M1 8s2.5-5 7-5c1.3 0 2.4.4 3.4 1M9.5 13a7 7 0 01-1.5.2c-4.5 0-7-5-7-5a13 13 0 011.8-2.4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  fire: () => (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <path d="M5.5 1S3 4 3 6.5C3 8.4 4.1 10 5.5 10S8 8.4 8 6.5C8 5.5 7 5 7 4c0-.8.5-1.5.5-1.5S5.5 3 5.5 1z" fill="#8f1d2b"/>
      <path d="M2 8c0 2.5 1.6 4 3.5 4S9 10.5 9 8c0-1-.5-1.7-.5-1.7S8 8 5.5 8 2.5 6.3 2.5 6.3 2 7 2 8z" fill="#c04059"/>
    </svg>
  ),
  lock: ({ size = 14, stroke = 'currentColor' }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="3" y="6" width="8" height="6" rx="1.2" stroke={stroke} strokeWidth="1.4"/>
      <path d="M5 6V4a2 2 0 014 0v2" stroke={stroke} strokeWidth="1.4"/>
    </svg>
  ),
  swap: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 5h10M2 5l2-2M2 5l2 2M12 9H2M12 9l-2-2M12 9l-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  settings: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  heart: ({ size = 12, fill = 'currentColor' }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill={fill}>
      <path d="M6 10.5S1 7.5 1 4.2C1 2.4 2.4 1 4 1c1 0 1.7.5 2 1 .3-.5 1-1 2-1 1.6 0 3 1.4 3 3.2 0 3.3-5 6.3-5 6.3z"/>
    </svg>
  ),
  bell: ({ stroke = 'currentColor' }: IconProps = {}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5.5a4 4 0 018 0v3l1 2H2l1-2v-3z" stroke={stroke} strokeWidth="1.3"/>
      <path d="M5.5 12a1.5 1.5 0 003 0" stroke={stroke} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

// Tab bar icons
export const TabIcons = {
  today: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}/>
      <circle cx="11" cy="11" r="2" fill="currentColor" opacity={active ? 1 : 0.5}/>
    </svg>
  ),
  cal: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}/>
      <path d="M3 9h16" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}/>
      <path d="M7 3v3M15 3v3" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} strokeLinecap="round"/>
    </svg>
  ),
  habits: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 2C8 5.5 5 9 5 13a6 6 0 0012 0c0-4-3-7.5-6-11z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M11 13c-1 1.5-1 3.5 0 4.5 1-1 1-3 0-4.5z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
        strokeLinecap="round"
        fill={active ? 'currentColor' : 'none'}
      />
    </svg>
  ),
  money: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2.5" y="6" width="17" height="11" rx="2" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}/>
      <path d="M2.5 10h17" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}/>
      <circle cx="11" cy="13.5" r="1.5" fill="currentColor" opacity={active ? 1 : 0.5}/>
    </svg>
  ),
};
