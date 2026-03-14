import styles from './StatCard.module.scss';

type Accent = 'blue' | 'green' | 'amber' | 'red' | 'purple';

interface StatCardProps {
  value: string | number;
  label: string;
  accent?: Accent;
}

export function StatCard({ value, label, accent = 'blue' }: StatCardProps) {
  return (
    <div className={`${styles.stat} ${styles[accent]}`}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
