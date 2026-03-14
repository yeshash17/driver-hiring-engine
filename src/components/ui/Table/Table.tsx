import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Table.module.scss';

interface TableWrapProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxHeight?: boolean;
}

export function TableWrap({ children, maxHeight, className = '', ...rest }: TableWrapProps) {
  const cls = [styles.tblWrap, maxHeight ? styles.maxHeight : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
