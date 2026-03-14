import type { ReactNode } from 'react';
import styles from './FormField.module.scss';

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className={styles.fg}>
      <label>{label}</label>
      {children}
    </div>
  );
}
