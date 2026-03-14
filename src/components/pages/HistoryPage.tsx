import { useAppStore } from '../../store/useAppStore';
import { getVillas } from '../../utils/schedule.utils';
import { Card, CardHeader, CardTitle, Tag, Button, TableWrap, EmptyState } from '../ui/index';

interface HistoryPageProps {
  onToast: (msg: string) => void;
}

export function HistoryPage({ onToast }: HistoryPageProps) {
  const { db, setActiveWeek, setVilla, deleteWeek, clearAll } = useAppStore();
  const items = Object.entries(db.weeks).sort((a, b) => a[0].localeCompare(b[0]));

  const handleOpen = (key: string) => {
    const wkData = db.weeks[key];
    setActiveWeek(key);
    const villas = getVillas(wkData);
    setVilla(villas[0] ?? null);
    onToast('Week activated');
  };

  const handleDelete = (key: string) => {
    if (!confirm('Delete this week?')) return;
    deleteWeek(key);
    onToast('Week deleted');
  };

  const handleClearAll = () => {
    if (!confirm('Delete all stored weeks?')) return;
    clearAll();
    onToast('All weeks cleared');
  };

  if (items.length === 0) {
    return <EmptyState icon="📅" heading="No weeks stored" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stored weeks</CardTitle>
        <Button variant="danger" size="sm" onClick={handleClearAll}>Delete all</Button>
      </CardHeader>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Week</th><th>Uploaded</th><th>Rows</th><th>Edits</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([k, w]) => (
              <tr key={k}>
                <td><strong>{w.label}</strong></td>
                <td>{new Date(w.uploadDate).toLocaleDateString()}</td>
                <td>{w.base.emp.length} shifts · {w.base.car.length} cars</td>
                <td>
                  {Object.keys(w.edits.weeklyShift || {}).length} weekly ·{' '}
                  {Object.keys(w.edits.shift || {}).length} shift ·{' '}
                  {Object.keys(w.edits.carDriver || {}).length} driver
                </td>
                <td>
                  {w.locked
                    ? <Tag color="red">Locked</Tag>
                    : <Tag color="green">Editable</Tag>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="primary" size="sm" onClick={() => handleOpen(k)}>Open</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(k)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}
