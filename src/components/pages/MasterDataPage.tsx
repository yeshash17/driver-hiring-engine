import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentWeek, useEffectiveWeek } from '../../hooks/useCurrentWeek';
import { Card, CardHeader, CardTitle, Alert, TableWrap, EmptyState, Tag, TabBar } from '../ui/index';
import type { EmployeeMeta } from '../../models/week.model';

export function MasterDataPage() {
  const [tab, setTab] = useState('schedule');
  const { wk, updateMeta, updateManagerMap } = useAppStore();
  const currentWeek = useCurrentWeek();
  const eff = useEffectiveWeek();

  if (!currentWeek || !eff || !wk) {
    return <EmptyState icon="👥" heading="No week loaded" />;
  }

  // IDs that have shift rows this week
  const scheduleIds = new Set(
    eff.emp.map((x) => x.id)
      .concat(eff.car.map((x) => x.driver))
      .filter(Boolean)
  );

  // All IDs from meta (includes EmployeeMaster-only employees)
  const allMetaIds = Object.keys(currentWeek.meta).sort();

  // Schedule employees (have branches)
  const scheduleEmpIds = [...scheduleIds].sort();

  // Bench employees: in meta but NOT in any shift this week
  const benchIds = allMetaIds.filter((id) => !scheduleIds.has(id));

  const branches = [...new Set(eff.emp.map((x) => x.br))].sort();

  const handleMeta = (empId: string, field: keyof EmployeeMeta, value: unknown) => {
    updateMeta(wk, empId, field, field === 'canDrive' ? value === 'true' : value);
  };

  const metaRow = (id: string, showBranch = true) => {
    const m = currentWeek.meta[id] || {
      id, canDrive: false, experience: 'Mid' as const,
      homeBranch: '', manager: '', name: '',
    };
    return (
      <tr key={id}>
        <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{id}</td>
        <td>
          <input
            disabled={currentWeek.locked}
            defaultValue={m.name || ''}
            onBlur={(e) => handleMeta(id, 'name', e.target.value)}
            style={{ width: 140, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
          />
        </td>
        <td>
          <select
            disabled={currentWeek.locked}
            value={m.canDrive ? 'true' : 'false'}
            onChange={(e) => handleMeta(id, 'canDrive', e.target.value)}
            style={{ width: 70, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </td>
        <td>
          <select
            disabled={currentWeek.locked}
            value={m.experience || 'Mid'}
            onChange={(e) => handleMeta(id, 'experience', e.target.value)}
            style={{ width: 90, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
          >
            <option>Junior</option><option>Mid</option><option>Senior</option>
          </select>
        </td>
        {showBranch && (
          <td>
            <select
              disabled={currentWeek.locked}
              value={m.homeBranch || ''}
              onChange={(e) => handleMeta(id, 'homeBranch', e.target.value)}
              style={{ minWidth: 130, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
            >
              <option value="">—</option>
              {branches.map((b) => <option key={b}>{b}</option>)}
            </select>
          </td>
        )}
        <td>
          <input
            disabled={currentWeek.locked}
            defaultValue={m.manager || ''}
            onBlur={(e) => handleMeta(id, 'manager', e.target.value)}
            style={{ width: 120, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
          />
        </td>
      </tr>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Employee attributes */}
      <Card locked={currentWeek.locked}>
        <CardHeader><CardTitle>Employee attributes</CardTitle></CardHeader>
        <Alert variant="info">
          Use this once per week or preload via an <strong>EmployeeMaster</strong> sheet.
          Driver replacements only show people marked with driving license.
          <strong> Bench employees</strong> (from master data, no shifts this week) are still available as swap candidates.
        </Alert>

        <TabBar
          tabs={[
            { id: 'schedule', label: `On schedule (${scheduleEmpIds.length})` },
            { id: 'bench', label: `Bench / available (${benchIds.length})`, badge: benchIds.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'schedule' && (
          <TableWrap maxHeight>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Can drive</th><th>Experience</th>
                  <th>Home branch</th><th>Manager</th>
                </tr>
              </thead>
              <tbody>
                {scheduleEmpIds.map((id) => metaRow(id, true))}
              </tbody>
            </table>
          </TableWrap>
        )}

        {tab === 'bench' && (
          <>
            {benchIds.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                No bench employees. Upload an EmployeeMaster file on the Upload page to add substitutes.
              </div>
            ) : (
              <>
                <Alert variant="warn">
                  These employees are from the master data file but have <strong>no shifts this week</strong>.
                  They appear as candidates in swap dropdowns. Mark driving license and experience here.
                </Alert>
                <TableWrap maxHeight>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th><th>Name</th><th>Can drive</th><th>Experience</th><th>Manager</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchIds.map((id) => metaRow(id, false))}
                    </tbody>
                  </table>
                </TableWrap>
              </>
            )}
          </>
        )}
      </Card>

      {/* Branch → Manager mapping */}
      <Card locked={currentWeek.locked}>
        <CardHeader>
          <CardTitle>Branch → Area manager mapping</CardTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(currentWeek.managerMap).filter(([, m]) => !m).length > 0 && (
              <Tag color="red">
                {Object.entries(currentWeek.managerMap).filter(([, m]) => !m).length} branch{Object.entries(currentWeek.managerMap).filter(([, m]) => !m).length !== 1 ? 'es' : ''} unassigned
              </Tag>
            )}
          </div>
        </CardHeader>
        <Alert variant="warn">
          Cross-manager floater detection uses this map. Fill it once and the review page will automatically flag people touching multiple managers.
        </Alert>
        <TableWrap maxHeight>
          <table>
            <thead>
              <tr><th>Branch</th><th>Area Manager</th><th>Status</th></tr>
            </thead>
            <tbody>
              {branches.map((br) => (
                <tr key={br}>
                  <td><strong>{br}</strong></td>
                  <td>
                    <input
                      disabled={currentWeek.locked}
                      defaultValue={currentWeek.managerMap[br] || ''}
                      onBlur={(e) => updateManagerMap(wk, br, e.target.value)}
                      style={{ width: 200, border: '1.5px solid var(--border)', borderRadius: 5, padding: '4px 6px', fontSize: '.78rem' }}
                      placeholder="Enter manager name…"
                    />
                  </td>
                  <td>
                    {currentWeek.managerMap[br]
                      ? <Tag color="green">{currentWeek.managerMap[br]}</Tag>
                      : <Tag color="red">Not assigned</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
