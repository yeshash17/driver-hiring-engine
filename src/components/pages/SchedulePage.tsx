import { useMemo } from 'react';
import { useCurrentWeek, useFilteredData } from '../../hooks/useCurrentWeek';
import { scheduleLabel } from '../../utils/schedule.utils';
import { DAYS } from '../../config/schedule.config';
import { Card, CardHeader, Tag, EmptyState, TableWrap } from '../ui/index';
import styles from './SchedulePage.module.scss';

export function SchedulePage() {
  const currentWeek = useCurrentWeek();
  const eff = useFilteredData();

  const matrix = useMemo(() => {
    if (!eff) return null;
    const branches = [...new Set(eff.emp.map((x) => x.br))].sort();
    return branches.map((br) => {
      const ids = [...new Set(eff.emp.filter((x) => x.br === br).map((x) => x.id))].sort();
      return { br, ids };
    });
  }, [eff]);

  if (!currentWeek || !eff || !matrix) {
    return (
      <EmptyState
        icon="📋"
        heading="No week loaded"
        description="Upload a schedule workbook to view the schedule matrix."
      />
    );
  }

  const activeDays = DAYS.filter((day) => eff.emp.some((r) => r.dayIn === day));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {matrix.map(({ br, ids }) => (
        <Card key={br}>
          <CardHeader>
            <div className={styles.branchHeader}>{br}</div>
            <Tag color="gray">{ids.length} staff</Tag>
          </CardHeader>
          <TableWrap maxHeight>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>Employee</th>
                  {activeDays.map((day) => (
                    <th key={day} style={{ minWidth: 120 }}>{day.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ids.map((id) => {
                  const meta = currentWeek.meta[id] || {};
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '.8rem' }}>{id}</div>
                        {meta.name && (
                          <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{meta.name}</div>
                        )}
                      </td>
                      {activeDays.map((day) => {
                        const rows = eff.emp.filter((r) => r.id === id && r.dayIn === day && r.br === br);
                        return (
                          <td key={day}>
                            {rows.length === 0 ? (
                              <span style={{ color: 'var(--muted)', fontSize: '.72rem' }}>—</span>
                            ) : (
                              rows.map((r) => (
                                <div key={r.rowId} className={styles.shiftCell}>
                                  <strong>{scheduleLabel(r)}</strong>
                                  <div className={styles.cellMeta}>{r.shH ? `${r.shH}h` : ''}</div>
                                  {(r.cIn || r.cOut) && (
                                    <div className={styles.cellCar}>
                                      {r.cIn && `In: ${r.cIn}`}
                                      {r.cIn && r.cOut && ' · '}
                                      {r.cOut && `Out: ${r.cOut}`}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      ))}
    </div>
  );
}
