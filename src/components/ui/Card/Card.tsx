import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.scss';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  locked?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
}

export function Card({ children, locked, className = '', ...rest }: CardProps) {
  const cls = [styles.card, locked ? styles.locked : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: CardHeaderProps) {
  return <div className={styles.cardHeader}>{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className={styles.cardTitle}>{children}</div>;
}
