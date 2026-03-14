import styles from './Tabs.module.scss';

export interface TabDef {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface TabBarProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'bar' | 'pill';
}

export function TabBar({ tabs, active, onChange, variant = 'bar' }: TabBarProps) {
  const barCls = variant === 'pill' ? styles.pillBar : styles.tabBar;
  const tabCls = variant === 'pill' ? styles.pillTab : styles.tab;

  return (
    <div className={barCls}>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`${tabCls} ${active === t.id ? styles.active : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && `${t.icon} `}{t.label}
          {t.badge != null && t.badge > 0 && (
            <span
              style={{
                background: 'var(--amber)',
                color: '#fff',
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '.62rem',
                marginLeft: '4px',
              }}
            >
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
