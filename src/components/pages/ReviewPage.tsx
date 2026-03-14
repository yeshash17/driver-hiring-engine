import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentWeek, useFilteredData, useEffectiveWeek } from '../../hooks/useCurrentWeek';
import {
  rowIssues, getCandidates, getWeeklyCandidates,
  scoreCandidate, empLabel, scheduleLabel, shiftEnd,
  employeeSummary, carRowsForShift,
} from '../../utils/schedule.utils';
import { fmtHr, tdDur } from '../../utils/time.utils';
import { pathStops } from '../../utils/parse.utils';
import { DAYS } from '../../config/schedule.config';
import {
  Card, CardHeader, CardTitle, Alert, Tag, Pill, Button, EmptyState, TableWrap,
} from '../ui/index';
import styles from './ReviewPage.module.scss';

interface ReviewPageProps {
  onToast: (msg: string) => void;
}

type StatusFilter = 'needs' | 'all' | 'clean';

export function ReviewPage({ onToast }: ReviewPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('needs');
  const [branchFilter, setBranchFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [search, setSearch] = useState('');

  const { wk, applyShiftEdit, clearShiftEdit, applyWeekEdit, clearWeekEdit } = useAppStore();
  const currentWeek = useCurrentWeek();
  const eff = useFilteredData();
  const allEff = useEffectiveWeek();

  const branches = useMemo(() => eff ? [...new Set(eff.emp.map((x) => x.br))].sort() : [], [eff]);

  const groupedEmployees = useMemo(() => {
    if (!eff || !allEff || !currentWeek) return [];
    const q = search.toUpperCase();
    const rows = eff.emp.filter((r) => {
      const issues = rowIssues(r, allEff, currentWeek.managerMap);
      if (statusFilter === 'needs' && !issues.length) return false;
      if (statusFilter === 'clean' && issues.length) return false;
      if (branchFilter && r.br !== branchFilter) return false;
      if (dayFilter && r.dayIn !== dayFilter) return false;
      if (q && !`${r.id} ${r.br} ${(currentWeek.meta[r.id] || {}).name || ''}`.toUpperCase().includes(q)) return false;
      return true;
    });
    const ids = [...new Set(rows.map((r) => r.id))].sort();
    return ids.map((id) => ({
      id,
      summary: employeeSummary(rows, id),
      flagSet: [...new Set(rows.filter((r) => r.id === id).flatMap((r) => rowIssues(r, allEff, currentWeek.managerMap)))],
    }));
  }, [eff, allEff, currentWeek, statusFilter, branchFilter, dayFilter, search]);

  if (!currentWeek || !eff || !allEff || !wk) {
    return (
      <EmptyState
        icon="🛠"
        heading="No week loaded"
        description="Upload a schedule workbook first."
      />
    );
  }

  const handleApplyShift = (rowId: number, selectEl: HTMLSelectElement) => {
    const newId = selectEl.value;
    if (!newId) { onToast('Select a replacement first'); return; }
    applyShiftEdit(wk, rowId, newId);
    onToast('Shift replacement applied');
  };

  const handleClearShift = (rowId: number) => {
    clearShiftEdit(wk, rowId);
    onToast('Shift reset');
  };

  const handleApplyWeek = (empId: string, selectEl: HTMLSelectElement) => {
    const newId = selectEl.value;
    if (!newId) { onToast('Select a replacement first'); return; }
    applyWeekEdit(wk, empId, newId);
    onToast('Weekly swap applied');
  };

  const handleClearWeek = (empId: string) => {
    clearWeekEdit(wk, empId);
    onToast('Weekly swap reset');
  };

  return (
    <>
      <Card locked={currentWeek.locked}>
        <CardHeader>
          <CardTitle>Review &amp; Replace</CardTitle>
          <div className={styles.weekbar}>
            <Tag color="blue">Weekly swaps: {Object.keys(currentWeek.edits.weeklyShift || {}).length}</Tag>
            <Tag color="green">Shift swaps: {Object.keys(currentWeek.edits.shift || {}).length}</Tag>
          </div>
        </CardHeader>

        <Alert variant="info">
          Show the full weekly employee schedule here. You can replace the whole employee for the week, or only one specific shift. Employee schedule and transport are shown together.
        </Alert>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.fg}>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="needs">Needs review</option>
              <option value="all">All rows</option>
              <option value="clean">Clean only</option>
            </select>
          </div>
          <div className={styles.fg}>
            <label>Branch</label>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className={styles.fg}>
            <label>Day</label>
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="">All days</option>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className={styles.fg} style={{ flexGrow: 1 }}>
            <label>Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Employee ID or name…"
            />
          </div>
        </div>

        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Employee / Weekly plan</th>
                <th style={{ minWidth: 220 }}>Whole-week replacement</th>
                <th style={{ minWidth: 160 }}>Flags</th>
                <th>Apply</th>
              </tr>
            </thead>
            <tbody>
              {groupedEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>
                    No employees match the current filters.
                  </td>
                </tr>
              )}
              {groupedEmployees.map(({ id, summary, flagSet }) => {
                const weekCurrent = currentWeek.edits.weeklyShift[id] || '';
                const weekCands = getWeeklyCandidates(id, allEff, currentWeek)
                  .sort((a, b) => {
                    const sampleRow = allEff.emp.find((r) => r.id === id) || allEff.emp[0];
                    if (!sampleRow) return 0;
                    return scoreCandidate(a, sampleRow, eff, currentWeek) - scoreCandidate(b, sampleRow, eff, currentWeek);
                  });
                let weekSel: HTMLSelectElement | null = null;

                return (
                  <tr key={id}>
                    {/* Column 1: Employee + shift cards */}
                    <td style={{ verticalAlign: 'top', minWidth: 340 }}>
                      <div className={styles.empHeader}>
                        <span className={styles.empId}>{id}</span>
                        {(currentWeek.meta[id] || {}).name && (
                          <span className={styles.empName}>· {(currentWeek.meta[id] || {}).name}</span>
                        )}
                        {weekCurrent && <Tag color="green">↔ {weekCurrent}</Tag>}
                      </div>
                      <div className={styles.empMeta}>
                        {summary.branches.join(', ')} · {summary.totalH.toFixed(1)} hrs · {summary.rows.length} shift{summary.rows.length !== 1 ? 's' : ''}
                      </div>

                      {/* Shift cards */}
                      {summary.rows.map((r) => {
                        const shiftCurrent = currentWeek.edits.shift[r.rowId] || '';
                        const shiftCands = getCandidates(r, eff, currentWeek)
                          .sort((a, b) => scoreCandidate(a, r, eff, currentWeek) - scoreCandidate(b, r, eff, currentWeek));
                        const carRows = carRowsForShift(r, allEff.car);
                        const shiftIssues = rowIssues(r, allEff, currentWeek.managerMap);
                        let shiftSel: HTMLSelectElement | null = null;

                        return (
                          <div key={r.rowId} className={`${styles.shiftCard} ${shiftCurrent ? styles.swapApplied : ''}`}>
                            <div className={styles.shiftCardGrid}>
                              {/* Shift time / branch */}
                              <div className={styles.sched}>
                                <strong>{r.dayIn} · {r.br}</strong>
                                <Pill>{scheduleLabel(r)}</Pill>
                                <span className={styles.subtle}>
                                  Work: {fmtHr(r.hIn)} → {fmtHr(r.hOut)}
                                  {shiftEnd(r) !== r.hOut && ` · Leave: ${fmtHr(shiftEnd(r) as import('../../models/week.model').TimeValue)}`}
                                </span>
                                {shiftIssues.length > 0 && (
                                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {shiftIssues.map((iss) => (
                                      <Tag key={iss} color={
                                        iss.includes('Dummy') ? 'red'
                                        : iss.includes('Cross') ? 'amber'
                                        : iss.includes('Floater') ? 'purple'
                                        : 'blue'
                                      }>{iss}</Tag>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Transport */}
                              <div className={styles.mini}>
                                {r.cIn && (
                                  <div>
                                    <strong>Pickup:</strong> <span className={styles.mono}>{r.cIn}</span>
                                    {r.tripInStart != null && ` · ${fmtHr(r.tripInStart)}`}
                                    {r.tripInDur != null && ` · ${tdDur(r.tripInDur)}`}
                                  </div>
                                )}
                                {r.cOut && (
                                  <div>
                                    <strong>Return:</strong> <span className={styles.mono}>{r.cOut}</span>
                                    {r.tripOutStart != null && ` · ${fmtHr(r.tripOutStart)}`}
                                    {r.tripOutDur != null && ` · ${tdDur(r.tripOutDur)}`}
                                  </div>
                                )}
                                {!r.cIn && !r.cOut && <span className={styles.muted}>No transport</span>}
                              </div>

                              {/* Linked cars */}
                              <div className={styles.mini}>
                                {carRows.length > 0 ? carRows.slice(0, 2).map((c) => {
                                  const stops = pathStops(c.pathId, r.v);
                                  return (
                                    <div key={c.rowId}>
                                      <strong className={styles.mono}>{c.plate}</strong>
                                      <span className={styles.muted}> Driver: {c.driver || '—'}</span>
                                      {stops.length > 0 && (
                                        <div className={styles.route}>
                                          {stops.map((s, i) => (
                                            <span key={i}>
                                              {i > 0 && <span className={styles.arrow}>→</span>}
                                              <span className={`${styles.stop}${s.isVilla ? ` ${styles.villa}` : ''}`}>{s.label}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }) : <span className={styles.muted}>No linked car</span>}
                              </div>

                              {/* Shift swap */}
                              <div className={styles.stack}>
                                <select
                                  ref={(el) => { shiftSel = el; }}
                                  defaultValue={shiftCurrent}
                                  disabled={currentWeek.locked}
                                  style={{ minWidth: 180, padding: 7, border: '1.5px solid var(--border)', borderRadius: 7, fontSize: '.8rem' }}
                                >
                                  <option value="">— shift swap —</option>
                                  {shiftCands.map((cid) => (
                                    <option key={cid} value={cid}>{empLabel(cid, currentWeek.meta)}</option>
                                  ))}
                                </select>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Button
                                    variant="primary" size="sm"
                                    disabled={currentWeek.locked}
                                    onClick={() => shiftSel && handleApplyShift(r.rowId, shiftSel)}
                                  >Apply shift</Button>
                                  {shiftCurrent && (
                                    <Button
                                      variant="ghost" size="sm"
                                      disabled={currentWeek.locked}
                                      onClick={() => handleClearShift(r.rowId)}
                                    >Reset</Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </td>

                    {/* Column 2: Weekly swap */}
                    <td style={{ verticalAlign: 'top' }}>
                      <div className={styles.weekSwapBox}>
                        <select
                          ref={(el) => { weekSel = el; }}
                          defaultValue={weekCurrent}
                          disabled={currentWeek.locked}
                          style={{ width: '100%', padding: 7, border: '1.5px solid var(--border)', borderRadius: 7, fontSize: '.8rem' }}
                        >
                          <option value="">— week swap —</option>
                          {weekCands.map((cid) => (
                            <option key={cid} value={cid}>{empLabel(cid, currentWeek.meta)}</option>
                          ))}
                        </select>
                        {weekCurrent && (
                          <Button
                            variant="ghost" size="sm"
                            disabled={currentWeek.locked}
                            onClick={() => handleClearWeek(id)}
                          >Reset week swap</Button>
                        )}
                      </div>
                    </td>

                    {/* Column 3: Flags */}
                    <td style={{ verticalAlign: 'top' }}>
                      <div className={styles.flagBox}>
                        {flagSet.length > 0 ? flagSet.map((f) => (
                          <Tag key={f} color={
                            f.includes('Dummy') ? 'red'
                            : f.includes('Driver') ? 'blue'
                            : f.includes('Cross') ? 'amber'
                            : f.includes('Floater') ? 'purple'
                            : 'gray'
                          }>{f}</Tag>
                        )) : <Tag color="green">Clean</Tag>}
                      </div>
                    </td>

                    {/* Column 4: Apply week swap */}
                    <td style={{ verticalAlign: 'top' }}>
                      <Button
                        variant="primary" size="sm"
                        disabled={currentWeek.locked}
                        onClick={() => weekSel && handleApplyWeek(id, weekSel)}
                      >Apply week swap</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      {/* Export section */}
      <Card>
        <CardHeader>
          <CardTitle>Export branches</CardTitle>
        </CardHeader>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className={styles.exportSection}>
            <label style={{ display: 'block', fontSize: '.7rem', color: 'var(--muted)', marginBottom: 6 }}>
              Branches to export (hold Ctrl/⌘ for multi-select)
            </label>
            <select
              id="exportBranches"
              multiple
              size={Math.min(branches.length, 8)}
              defaultValue={branches}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 7, padding: 6 }}
            >
              {branches.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className={styles.stack}>
            <Button
              variant="green"
              onClick={async () => {
                const sel = document.getElementById('exportBranches') as HTMLSelectElement | null;
                const chosen = sel ? [...sel.selectedOptions].map((o) => o.value) : branches;
                const { exportReviewedWorkbook } = await import('../../utils/excel.utils');
                const { filteredData } = await import('../../utils/schedule.utils');
                const data = filteredData(currentWeek, null, '');
                await exportReviewedWorkbook(currentWeek, data, chosen);
                onToast('Workbook exported');
              }}
            >Export selected branches</Button>
          </div>
        </div>
        <p className={styles.subtle} style={{ marginTop: 10 }}>
          Export includes both employee shifts and linked car shifts for the selected branches.
        </p>
      </Card>
    </>
  );
}
