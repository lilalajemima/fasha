export type IconName =
  | 'discover' | 'activity' | 'portfolio' | 'profile' | 'initiatives'
  | 'overview' | 'opportunities' | 'review' | 'attendance' | 'bell' | 'scan' | 'link' | 'share'
  | 'users' | 'export' | 'eye' | 'eyeOff'
  | 'menu' | 'close' | 'signout' | 'caret'

const PATHS: Record<IconName, string> = {
  discover:      'M12 3a9 9 0 100 18 9 9 0 000-18zM15 9l-2 4-4 2 2-4 4-2z',
  activity:      'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z',
  portfolio:     'M12 3a4 4 0 100 8 4 4 0 000-8zM9 11l-1 9 4-2 4 2-1-9',
  profile:       'M12 4a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM5 20a7 7 0 0114 0',
  initiatives:   'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  overview:      'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  opportunities: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  review:        'M3 7l9 6 9-6M4 6h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z',
  attendance:    'M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15h2v2h-2zM18 18h2v2h-2z',
  bell:          'M12 3a5 5 0 015 5v4l1.5 3h-13L7 12V8a5 5 0 015-5zM10 18a2 2 0 004 0',
  scan:          'M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3M7 12h10',
  link:          'M10 13a4 4 0 005.7 0l2.3-2.3a4 4 0 10-5.7-5.7L11 6.3M14 11a4 4 0 00-5.7 0L6 13.3a4 4 0 105.7 5.7L13 17.7',
  share:         'M17 7a2 2 0 100-4 2 2 0 000 4zM7 14a2 2 0 100-4 2 2 0 000 4zM17 21a2 2 0 100-4 2 2 0 000 4zM9 11l6-3M9 13l6 3',
  users:         'M9 4a3.2 3.2 0 100 6.4A3.2 3.2 0 009 4zM3 20a6 6 0 0112 0M16 4.6a3.2 3.2 0 010 5.8M18 14.4a6 6 0 013 5.6',
  export:        'M12 4v10M8.5 10.5L12 14l3.5-3.5M5 18h14',
  eye:           'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6zM12 9.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z',
  eyeOff:        'M4 4l16 16M9.9 5.3A9.6 9.6 0 0112 5c6.4 0 10 6 10 6a16 16 0 01-3.3 3.9M6.4 7.6A16 16 0 002 11s3.6 6 10 6c1.3 0 2.5-.2 3.5-.6M10.2 10.2a2.6 2.6 0 003.6 3.6',
  menu:          'M4 7h16M4 12h16M4 17h16',
  close:         'M6 6l12 12M18 6L6 18',
  signout:       'M10 5H6a1 1 0 00-1 1v12a1 1 0 001 1h4M15 8l4 4-4 4M19 12H9',
  caret:         'M6 9l6 6 6-6',
}

export default function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d={PATHS[name]} />
    </svg>
  )
}
