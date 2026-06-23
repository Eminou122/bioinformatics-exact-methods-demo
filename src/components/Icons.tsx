import React from 'react';

type IconName =
  | 'book'
  | 'check'
  | 'alert'
  | 'x'
  | 'clipboard'
  | 'shield'
  | 'ledger'
  | 'search'
  | 'help'
  | 'info'
  | 'network'
  | 'route'
  | 'language'
  | 'play'
  | 'reset'
  | 'step';

interface IconProps {
  name: IconName;
  size?: number;
  decorative?: boolean;
  label?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Zm0 0A2.5 2.5 0 0 1 6.5 8H20" />,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.5a2 2 0 0 0-3.4 0Z" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  clipboard: <><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" /><path d="M9 11h6" /><path d="M9 15h4" /></>,
  shield: <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />,
  ledger: <><path d="M6 3h10l2 2v16H6V3Z" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.5 1.2-1.5 2.5" /><path d="M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>,
  network: <><circle cx="6" cy="7" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="12" cy="17" r="2" /><path d="m8 8 3 7" /><path d="m16 8-3 7" /><path d="M8 7h8" /></>,
  route: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="M8 5h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5" /></>,
  language: <><path d="M4 5h9" /><path d="M9 3v2c0 4-2 7-5 9" /><path d="M5 10c2 0 5 2 7 4" /><path d="M14 21l4-9 4 9" /><path d="M15.5 18h5" /></>,
  play: <path d="M8 5v14l11-7-11-7Z" />,
  reset: <><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v6h6" /></>,
  step: <><path d="M5 5v14" /><path d="m9 5 8 7-8 7V5Z" /></>,
};

export const Icon: React.FC<IconProps> = ({ name, size = 18, decorative = true, label }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={decorative ? 'true' : undefined}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : label}
    focusable="false"
  >
    {paths[name]}
  </svg>
);
