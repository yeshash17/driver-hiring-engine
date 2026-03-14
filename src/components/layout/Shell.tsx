import type { ReactNode } from 'react';
import styles from './Shell.module.scss';

interface ShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export function Shell({ sidebar, topbar, children }: ShellProps) {
  return (
    <div className={styles.shell}>
      {sidebar}
      <div className={styles.main}>
        {topbar}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
