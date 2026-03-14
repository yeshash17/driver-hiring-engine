import type { ReactNode } from 'react';
import styles from './Alert.module.scss';

type AlertVariant = 'info' | 'warn' | 'success' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const cls = [styles.alert, styles[variant], className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}
