import { useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import { PAGE_TITLES } from '../../config/navigation.config';
import type { PageKey } from '../../config/navigation.config';
import { Button } from '../ui/Button/Button';
import { filteredData } from '../../utils/schedule.utils';
import { exportReviewedWorkbook } from '../../utils/excel.utils';
import styles from './TopBar.module.scss';

interface TopBarProps {
  onToast: (msg: string) => void;
}

export function TopBar({ onToast }: TopBarProps) {
  const location = useLocation();
  const { wk, villa, managerFilter, toggleLock } = useAppStore();
  const currentWeek = useCurrentWeek();

  // Derive page title from current route
  const pathSegment = location.pathname.replace('/', '') as PageKey;
  const title = PAGE_TITLES[pathSegment] ?? 'ShiftHQ';

  const chipText = currentWeek
    ? `${currentWeek.label} · ${villa || 'All Villas'}${currentWeek.locked ? ' · Locked' : ' · Editable'}`
    : 'No week selected';

  const handleLock = () => {
    if (!wk) return;
    toggleLock(wk);
    onToast(currentWeek?.locked ? 'Week unlocked' : 'Week locked');
  };

  const handleExport = async () => {
    if (!currentWeek || !wk) { onToast('No week selected'); return; }
    try {
      const data = filteredData(currentWeek, villa, managerFilter);
      await exportReviewedWorkbook(currentWeek, data, []);
      onToast('Reviewed workbook exported');
    } catch {
      onToast('Export failed');
    }
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.title}>{title}</div>
      <div className={styles.chip}>{chipText}</div>
      <div className={styles.spacer} />
      <Button
        variant={currentWeek?.locked ? 'danger' : 'ghost'}
        size="sm"
        onClick={handleLock}
        disabled={!currentWeek}
      >
        {currentWeek?.locked ? '🔒 Locked' : '🔓 Unlock'}
      </Button>
      <Button variant="green" size="sm" onClick={handleExport} disabled={!currentWeek}>
        ⬇ Export Reviewed File
      </Button>
    </div>
  );
}
