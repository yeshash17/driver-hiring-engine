import type { ReactNode } from 'react';
import styles from './Pill.module.scss';

export function Pill({ children }: { children: ReactNode }) {
  return <span className={styles.pill}>{children}</span>;
}
