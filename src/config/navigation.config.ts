export type PageKey =
  | 'upload'
  | 'dashboard'
  | 'review'
  | 'drivers'
  | 'schedule'
  | 'master'
  | 'history'
  | 'how-to';

export interface NavItem {
  id: PageKey;
  label: string;
  icon: string;
  path: string;
}

export const PAGE_TITLES: Record<PageKey, string> = {
  upload: 'Upload',
  dashboard: 'Dashboard',
  review: 'Review & Replace',
  drivers: 'Driver Review',
  schedule: 'Schedule Matrix',
  master: 'Master Data',
  history: 'Week History',
  'how-to': 'How to Use',
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'upload',    label: 'Upload',           icon: '⬆',  path: '/upload' },
  { id: 'dashboard', label: 'Dashboard',         icon: '🏠',  path: '/dashboard' },
  { id: 'review',    label: 'Review & Replace',  icon: '🛠',  path: '/review' },
  { id: 'drivers',   label: 'Driver Review',     icon: '🚗',  path: '/drivers' },
  { id: 'schedule',  label: 'Schedule Matrix',   icon: '📋',  path: '/schedule' },
  { id: 'master',    label: 'Master Data',       icon: '👥',  path: '/master' },
  { id: 'history',   label: 'Week History',      icon: '📅',  path: '/history' },
  { id: 'how-to',    label: 'How to Use',        icon: '📖',  path: '/how-to' },
];
