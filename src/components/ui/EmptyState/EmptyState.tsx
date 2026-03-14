import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon?: string;
  heading: string;
  description?: string;
}

export function EmptyState({
  icon = '📭',
  heading,
  description,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.heading}>{heading}</div>
      {description && <div className={styles.description}>{description}</div>}
    </div>
  );
}
