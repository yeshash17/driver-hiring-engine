import type { ReactNode } from 'react';
import styles from './StatsGrid.module.scss';

export function StatsGrid({ children }: { children: ReactNode }) {
  return <div className={styles.statsGrid}>{children}</div>;
}
