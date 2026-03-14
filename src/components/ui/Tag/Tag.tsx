import type { ReactNode } from 'react';
import styles from './Tag.module.scss';

type TagColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';

interface TagProps {
  color?: TagColor;
  children: ReactNode;
}

export function Tag({ color = 'gray', children }: TagProps) {
  return (
    <span className={`${styles.tag} ${styles[color]}`}>{children}</span>
  );
}
