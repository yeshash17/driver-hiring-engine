import { useAppStore } from '../../store/useAppStore';
import { useCurrentWeek, useFilteredData } from '../../hooks/useCurrentWeek';
import { parsePax } from '../../utils/parse.utils';
import { pathStops } from '../../utils/parse.utils';
import { fmtHr } from '../../utils/time.utils';
import { empLabel } from '../../utils/schedule.utils';
import {
  Card, CardHeader, CardTitle, Tag, Pill, Button, TableWrap, EmptyState, Alert,
} from '../ui/index';
import styles from './ReviewPage.module.scss';

interface DriversPageProps {
  onToast: (msg: string) => void;
}

export function DriversPage({ onToast }: DriversPageProps) {
  const { wk, applyCarDriverEdit, clearCarDriverEdit } = useAppStore();
  const currentWeek = useCurrentWeek();
  const eff = useFilteredData();

  if (!currentWeek || !eff || !wk) {
    return <EmptyState icon="🚗" heading="No week loaded" />;
  }

  const unlicensed = eff.car.filter((c) => c.driver && !(currentWeek.meta[c.driver] || {}).canDrive);

  const handleApply = (rowId: number, selectEl: HTMLSelectElement) => {
    const newId = selectEl.value;
    if (!newId) { onToast('Choose a licensed replacement'); return; }
    applyCarDriverEdit(wk, rowId, newId);
    onToast('Driver updated');
  };

  const handleClear = (rowId: number) => {
    clearCarDriverEdit(wk, rowId);
    onToast('Driver reset');
  };

  return (
    <Card locked={currentWeek.locked}>
      <CardHeader>
        <CardTitle>Driver reassignment</CardTitle>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag color="blue">Driver edits: {Object.keys(currentWeek.edits.carDriver || {}).length}</Tag>
          {unlicensed.length > 0 && (
            <Tag color="red">Unlicensed drivers: {unlicensed.length}</Tag>
          )}
        </div>
      </CardHeader>

      {unlicensed.length > 0 && (
        <Alert variant="warn">
          {unlicensed.length} car{unlicensed.length !== 1 ? 's' : ''} have drivers without a driving license on record. Assign licensed replacements below.
        </Alert>
      )}

      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Car</th>
              <th>Day / Dept.</th>
              <th>Route &amp; Passengers</th>
              <th>Current driver</th>
              <th>Licensed replacement</th>
              <th>Apply</th>
            </tr>
          </thead>
          <tbody>
            {eff.car.map((c) => {
              const meta = currentWeek.meta[c.driver] || {};
              const isLicensed = !c.driver || meta.canDrive !== false;
              const pax = parsePax(c.pax);
              const stops = pathStops(c.pathId, c.v);
              const current = currentWeek.edits.carDriver[c.rowId] || '';

              // Build licensed pool: all licensed employees in meta
              const licensed = [
                ...new Set(
                  eff.emp
                    .map((x) => x.id)
                    .concat(Object.keys(currentWeek.meta))
                ),
              ].filter((id) => (currentWeek.meta[id] || {}).canDrive).sort();

              let selectRef: HTMLSelectElement | null = null;

              return (
                <tr key={c.rowId} style={!isLicensed ? { background: '#fff8f8' } : undefined}>
                  <td>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{c.plate}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.72rem' }}>{c.type}</div>
                    {c.dist > 0 && (
                      <div style={{ color: 'var(--muted)', fontSize: '.7rem' }}>{c.dist} km · {c.fuel.toFixed(1)} SAR</div>
                    )}
                  </td>
                  <td>
                    <Tag color="gray">{c.day}</Tag>
                    <br />
                    <Pill>{fmtHr(c.hStart)}</Pill>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>
                      {c.nEmp} seat{c.nEmp !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    {stops.length > 0 && (
                      <div className={styles.route} style={{ marginBottom: 6 }}>
                        {stops.map((s, i) => (
                          <span key={i}>
                            {i > 0 && <span className={styles.arrow}>→</span>}
                            <span className={`${styles.stop}${s.isVilla ? ` ${styles.villa}` : ''}`}>{s.label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {pax.length > 0 ? (
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Passengers ({pax.length}):</strong>{' '}
                        {pax.map((p) => `${p.id}${p.stop ? ` @ ${p.stop}` : ''}`).join(' · ')}
                      </div>
                    ) : (
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>No passengers listed</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.driver || '—'}</div>
                    {c.driver && (
                      <>
                        {(currentWeek.meta[c.driver] || {}).name && (
                          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                            {(currentWeek.meta[c.driver] || {}).name}
                          </div>
                        )}
                        <div style={{ marginTop: 3 }}>
                          {isLicensed
                            ? <Tag color="green">Licensed</Tag>
                            : <Tag color="red">License missing</Tag>}
                        </div>
                        {current && (
                          <div style={{ marginTop: 3 }}>
                            <Tag color="blue">→ {current}</Tag>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <select
                      ref={(el) => { selectRef = el; }}
                      disabled={currentWeek.locked}
                      defaultValue={current}
                      style={{
                        minWidth: 180, padding: 7, fontSize: '.8rem',
                        border: current ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
                        borderRadius: 7,
                      }}
                    >
                      <option value="">— choose licensed driver —</option>
                      {licensed.map((id) => (
                        <option key={id} value={id}>
                          {empLabel(id, currentWeek.meta)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Button
                        variant="primary" size="sm"
                        disabled={currentWeek.locked}
                        onClick={() => selectRef && handleApply(c.rowId, selectRef)}
                      >Apply</Button>
                      {current && (
                        <Button
                          variant="ghost" size="sm"
                          disabled={currentWeek.locked}
                          onClick={() => handleClear(c.rowId)}
                        >Reset</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}
