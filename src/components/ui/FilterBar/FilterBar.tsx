import type { ReactNode } from 'react';
import styles from './FilterBar.module.scss';

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.fbar}>{children}</div>;
}
