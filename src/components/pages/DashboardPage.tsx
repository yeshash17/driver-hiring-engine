import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentWeek, useFilteredData, useEffectiveWeek } from '../../hooks/useCurrentWeek';
import {
  isFloater, isCrossManagerFloater, rowIssues, employeeBranches, employeeManagers,
  scheduleLabel, shiftDurationHours,
} from '../../utils/schedule.utils';
import { DAYS } from '../../config/schedule.config';
import {
  Card, CardHeader, CardTitle, Alert, Tag, StatCard, StatsGrid, TableWrap, EmptyState, Pill,
} from '../ui/index';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  useAppStore();
  const currentWeek = useCurrentWeek();
  const eff = useFilteredData();
  const allEff = useEffectiveWeek();

  const stats = useMemo(() => {
    if (!currentWeek || !eff || !allEff) return null;
    const uniqueEmp = [...new Set(eff.emp.map((x) => x.id))];
    const branches  = [...new Set(eff.emp.map((x) => x.br))].sort();
    const floaters  = uniqueEmp.filter((id) => isFloater(allEff.emp, id)).length;
    const cross     = uniqueEmp.filter((id) => isCrossManagerFloater(allEff.emp, id, currentWeek.managerMap)).length;
    const unlicensedDrivers = eff.car.filter(
      (c) => c.driver && !(currentWeek.meta[c.driver] || {}).canDrive
    ).length;
    const unresolved = eff.emp.filter((r) => rowIssues(r, allEff, currentWeek.managerMap).length).length;
    const unresolvedEmp = [...new Set(eff.emp.filter((r) => rowIssues(r, allEff, currentWeek.managerMap).length).map((r) => r.id))].length;
    const empCost = eff.emp.reduce((s, x) => s + Number(x.shC || 0), 0);
    const fuelCost = eff.car.reduce((s, x) => s + Number(x.fuel || 0), 0);

    // Day breakdown
    const dayBreakdown = DAYS.filter((d) => eff.emp.some((r) => r.dayIn === d)).map((d) => {
      const dayRows = eff.emp.filter((r) => r.dayIn === d);
      const dayEmp = [...new Set(dayRows.map((r) => r.id))];
      const dayHrs = dayRows.reduce((s, r) => s + shiftDurationHours(r), 0);
      return { day: d, empCount: dayEmp.length, shiftCount: dayRows.length, totalHrs: dayHrs };
    });

    return { branches, floaters, cross, unlicensedDrivers, unresolved, unresolvedEmp, empCost, fuelCost, uniqueEmp, dayBreakdown };
  }, [currentWeek, eff, allEff]);

  if (!currentWeek || !stats || !eff || !allEff) {
    return (
      <EmptyState
        icon="📊"
        heading="No week loaded"
        description="Upload a schedule workbook to start the review cycle."
      />
    );
  }

  const totalEdits = Object.keys(currentWeek.edits.shift || {}).length
    + Object.keys(currentWeek.edits.weeklyShift || {}).length
    + Object.keys(currentWeek.edits.carDriver || {}).length;

  return (
    <>
      <StatsGrid>
        <StatCard value={stats.uniqueEmp.length} label="Employees in scope" accent="blue" />
        <StatCard value={stats.branches.length}   label="Branches in scope"    accent="blue"   />
        <StatCard value={stats.floaters}           label="Floaters"             accent="purple" />
        <StatCard value={stats.cross}              label="Cross-manager"        accent="amber"  />
        <StatCard value={stats.unresolvedEmp}      label="Employees needing review" accent="red" />
        <StatCard value={stats.unlicensedDrivers}  label="Unlicensed drivers"   accent="red"    />
        <StatCard value={(stats.empCost + stats.fuelCost).toFixed(0)} label="Total weekly cost (SAR)" accent="green" />
        <StatCard value={totalEdits}               label="Edits applied so far" accent="green"  />
      </StatsGrid>

      <div className={styles.grid2}>
        {/* Week status */}
        <Card>
          <CardHeader><CardTitle>Week status</CardTitle></CardHeader>
          <Alert variant={currentWeek.locked ? 'warn' : 'success'}>
            {currentWeek.locked
              ? 'This week is locked. Unlock if managers still need to make changes.'
              : 'This week is editable. Make replacements, then lock and export when done.'}
          </Alert>
          <div className={styles.kv} style={{ marginTop: 12 }}>
            <Tag color="purple">Floaters: {stats.floaters}</Tag>
            <Tag color="amber">Cross-manager: {stats.cross}</Tag>
            <Tag color="red">Unlicensed drivers: {stats.unlicensedDrivers}</Tag>
            <Tag color="blue">Shift edits: {Object.keys(currentWeek.edits.shift || {}).length}</Tag>
            <Tag color="blue">Weekly swaps: {Object.keys(currentWeek.edits.weeklyShift || {}).length}</Tag>
            <Tag color="green">Driver edits: {Object.keys(currentWeek.edits.carDriver || {}).length}</Tag>
          </div>
          <div className={styles.muted}>
            Replacements are ranked: same branch → same area manager → junior first → licensed drivers. Use the <strong>Review &amp; Replace</strong> page to assign substitutes, and <strong>Driver Review</strong> for car assignments.
          </div>
        </Card>

        {/* Cost breakdown */}
        <Card>
          <CardHeader><CardTitle>Cost breakdown</CardTitle></CardHeader>
          <TableWrap>
            <table>
              <tbody>
                <tr>
                  <td><strong>Employee shifts cost</strong></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{stats.empCost.toFixed(2)} SAR</td>
                </tr>
                <tr>
                  <td><strong>Fuel / transport cost</strong></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{stats.fuelCost.toFixed(2)} SAR</td>
                </tr>
                <tr style={{ background: 'var(--surface2)' }}>
                  <td><strong>Total</strong></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                    {(stats.empCost + stats.fuelCost).toFixed(2)} SAR
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Daily shift distribution
            </div>
            {stats.dayBreakdown.map((d) => (
              <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Tag color="gray">{d.day.slice(0, 3)}</Tag>
                <span style={{ fontSize: '.78rem', color: 'var(--muted)', minWidth: 80 }}>{d.empCount} employees</span>
                <Pill>{d.shiftCount} shifts</Pill>
                <span style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.totalHrs.toFixed(1)} hrs</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Branch manager coverage */}
      <Card>
        <CardHeader><CardTitle>Branch coverage &amp; manager map</CardTitle></CardHeader>
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Manager</th>
                <th>Staff</th>
                <th>Peak allocated</th>
                <th>Floaters in branch</th>
              </tr>
            </thead>
            <tbody>
              {stats.branches.map((br) => {
                const peak = Math.max(0, ...eff.br.filter((x) => x.br === br).map((x) => x.allN || 0));
                const brEmp = [...new Set(eff.emp.filter((x) => x.br === br).map((x) => x.id))];
                const brFloaters = brEmp.filter((id) => isFloater(allEff.emp, id)).length;
                return (
                  <tr key={br}>
                    <td><strong>{br}</strong></td>
                    <td>{currentWeek.managerMap[br] || <span style={{ color: 'var(--red)' }}>Not set</span>}</td>
                    <td>{brEmp.length}</td>
                    <td>{peak}</td>
                    <td>
                      {brFloaters > 0
                        ? <Tag color="purple">{brFloaters} floater{brFloaters !== 1 ? 's' : ''}</Tag>
                        : <Tag color="gray">None</Tag>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      {/* Employees needing review */}
      {stats.unresolvedEmp > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employees needing review ({stats.unresolvedEmp})</CardTitle>
          </CardHeader>
          <TableWrap maxHeight>
            <table>
              <thead>
                <tr><th>Employee</th><th>Name</th><th>Branches</th><th>Manager span</th><th>Flags</th><th>Shifts this week</th></tr>
              </thead>
              <tbody>
                {stats.uniqueEmp
                  .filter((id) => eff.emp.some((r) => rowIssues(r, allEff, currentWeek.managerMap).length > 0 && r.id === id))
                  .map((id) => {
                    const brs  = employeeBranches(allEff.emp, id);
                    const mgrs = employeeManagers(allEff.emp, id, currentWeek.managerMap);
                    const floater = isFloater(allEff.emp, id);
                    const cross   = isCrossManagerFloater(allEff.emp, id, currentWeek.managerMap);
                    const canDrive = (currentWeek.meta[id] || {}).canDrive;
                    const shifts = allEff.emp.filter((r) => r.id === id);
                    return (
                      <tr key={id}>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{id}</td>
                        <td style={{ color: 'var(--muted)' }}>{(currentWeek.meta[id] || {}).name || '—'}</td>
                        <td>{brs.join(', ') || '—'}</td>
                        <td>{mgrs.join(', ') || '—'}</td>
                        <td>
                          {floater  && <Tag color="purple">Floater</Tag>}{' '}
                          {cross    && <Tag color="amber">Cross-mgr</Tag>}{' '}
                          {canDrive && <Tag color="green">Driver</Tag>}
                        </td>
                        <td>
                          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                            {shifts.map((r) => (
                              <div key={r.rowId}>{r.dayIn.slice(0, 3)} · {r.br} · <Pill>{scheduleLabel(r)}</Pill></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}
    </>
  );
}
