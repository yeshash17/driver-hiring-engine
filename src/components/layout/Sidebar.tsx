import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useVillas, useManagers, useWeekKeys } from '../../hooks/useCurrentWeek';
import { NAV_ITEMS } from '../../config/navigation.config';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { wk, villa, managerFilter, setActiveWeek, setVilla, setManagerFilter, db } = useAppStore();
  const villas = useVillas();
  const managers = useManagers();
  const weekKeys = useWeekKeys();

  const totalRecords = Object.values(db.weeks).reduce(
    (s, w) => s + (w.base?.emp?.length || 0),
    0
  );

  const handleWeekChange = (key: string) => {
    setActiveWeek(key || null);
    // Reset villa to first available
    const wkData = db.weeks[key];
    if (wkData) {
      const vs = [
        ...new Set([
          ...wkData.base.emp.map((x) => x.v),
          ...wkData.base.br.map((x) => x.v),
        ].filter(Boolean)),
      ].sort();
      setVilla(vs[0] ?? null);
    } else {
      setVilla(null);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>
          Shift<span className={styles.accent}>HQ</span>
        </h1>
        <p>Review · Replace · Lock · Export</p>
      </div>

      <div className={styles.sbWrap}>
        {/* Week selector */}
        <div className={styles.selBox}>
          <label>Week</label>
          <select
            value={wk ?? ''}
            onChange={(e) => handleWeekChange(e.target.value)}
          >
            {weekKeys.length === 0 ? (
              <option value="">— No weeks loaded —</option>
            ) : (
              weekKeys.map((k) => (
                <option key={k} value={k}>
                  {db.weeks[k].label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Villa selector */}
        <div className={styles.selBox}>
          <label>Villa</label>
          <select
            value={villa ?? ''}
            onChange={(e) => setVilla(e.target.value || null)}
          >
            {villas.length === 0 ? (
              <option value="">— Upload data first —</option>
            ) : (
              villas.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Manager filter */}
        <div className={styles.selBox}>
          <label>Area Manager View</label>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
          >
            <option value="">All managers</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <div className={styles.navSection}>Schedule Review</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className={styles.sbFoot}>
        {weekKeys.length > 0
          ? `${weekKeys.length} week${weekKeys.length !== 1 ? 's' : ''} · ${totalRecords} shift rows`
          : 'No data loaded'}
      </div>
    </aside>
  );
}
