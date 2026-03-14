import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useFileParser } from '../../hooks/useFileParser';
import {
  Card, CardHeader, CardTitle,
  Alert, Button, DropZone, FilterBar, FormField,
} from '../ui/index';
import styles from './UploadPage.module.scss';

interface UploadPageProps {
  onToast: (msg: string) => void;
}

export function UploadPage({ onToast }: UploadPageProps) {
  const navigate = useNavigate();
  const { wk } = useAppStore();
  const { handleScheduleFile, handleMasterFile } = useFileParser();

  const [wkLabel, setWkLabel] = useState('');
  const [wkYear, setWkYear] = useState('2026');
  const [upStatus, setUpStatus] = useState<{ type: 'info' | 'success' | 'danger'; msg: string } | null>(null);
  const [masterStatus, setMasterStatus] = useState<{ type: 'info' | 'success' | 'danger'; msg: string } | null>(null);

  const onScheduleFile = async (file: File) => {
    const label = (wkLabel.trim() || 'WK?').toUpperCase();
    setUpStatus({ type: 'info', msg: 'Reading schedule workbook…' });
    await handleScheduleFile(
      file,
      label,
      wkYear,
      (msg) => {
        setUpStatus({ type: 'success', msg });
        onToast('Schedule uploaded');
        navigate('/dashboard');
      },
      (msg) => setUpStatus({ type: 'danger', msg })
    );
  };

  const onMasterFile = async (file: File) => {
    if (!wk) { onToast('Upload/select a week first'); return; }
    setMasterStatus({ type: 'info', msg: 'Reading master workbook…' });
    await handleMasterFile(
      file,
      wk,
      () => {
        setMasterStatus({ type: 'success', msg: 'Master data loaded into the active week.' });
        onToast('Master data updated');
      },
      (msg) => setMasterStatus({ type: 'danger', msg })
    );
  };

  return (
    <div className={styles.uploadWrap}>
      {/* Schedule upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload weekly schedule</CardTitle>
        </CardHeader>
        <FilterBar>
          <FormField label="Week Label">
            <input
              maxLength={12}
              placeholder="e.g. WK32"
              value={wkLabel}
              onChange={(e) => setWkLabel(e.target.value)}
            />
          </FormField>
          <FormField label="Year">
            <select value={wkYear} onChange={(e) => setWkYear(e.target.value)}>
              <option>2025</option>
              <option>2026</option>
              <option>2027</option>
            </select>
          </FormField>
        </FilterBar>
        <DropZone
          onFile={onScheduleFile}
          heading="Drop the schedule workbook here"
          hint="Required sheets: Employees, Cars, Branch"
        />
        {upStatus && (
          <div style={{ marginTop: 14 }}>
            <Alert variant={upStatus.type}>{upStatus.msg}</Alert>
          </div>
        )}
      </Card>

      {/* Master data upload */}
      <Card>
        <CardHeader>
          <CardTitle>Master Data upload (optional)</CardTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = () => { if (input.files?.[0]) onMasterFile(input.files[0]); };
              input.click();
            }}
          >
            Upload Master File
          </Button>
        </CardHeader>
        <Alert variant="info">
          Preload employee names, driving licenses, experience level, and branch-to-manager mapping.
          Employees in the master file who have <em>no schedule rows</em> this week still appear in swap dropdowns.
        </Alert>
        <div style={{ fontSize: '.82rem', color: 'var(--text)', marginBottom: 10 }}>
          <strong>Required sheet names &amp; columns:</strong>
        </div>

        <div className={styles.schemaGrid}>
          {/* EmployeeMaster */}
          <div className={styles.schemaTable}>
            <div className={styles.schemaHeader}>Sheet: <strong>EmployeeMaster</strong></div>
            <table>
              <thead>
                <tr><th>Column</th><th>Required?</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {[
                  ['Employee ID', 'Required', 'Must match IDs in schedule (e.g. E01234)'],
                  ['Name', 'Recommended', 'Full name — shown in all dropdowns'],
                  ['Driving License', 'Optional', 'Yes / No — controls driver swap pool'],
                  ['Experience', 'Optional', 'Junior / Mid / Senior'],
                  ['Home Branch', 'Optional', 'Default branch assignment'],
                  ['Area Manager', 'Optional', 'Manager name — used for cross-manager detection'],
                ].map(([col, req, note]) => (
                  <tr key={col}>
                    <td><code>{col}</code></td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: 999,
                        fontSize: '.67rem', fontWeight: 700,
                        background: req === 'Required' ? '#feecec' : req === 'Recommended' ? '#e9fbf4' : '#eef2f6',
                        color: req === 'Required' ? '#922b21' : req === 'Recommended' ? '#14684e' : '#51606f',
                      }}>{req}</span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ManagerMap */}
          <div className={styles.schemaTable}>
            <div className={styles.schemaHeader}>Sheet: <strong>ManagerMap</strong></div>
            <table>
              <thead>
                <tr><th>Column</th><th>Required?</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {[
                  ['Branch', 'Required', 'Must match branch names in schedule'],
                  ['Area Manager', 'Required', 'Manager name for this branch'],
                ].map(([col, req, note]) => (
                  <tr key={col}>
                    <td><code>{col}</code></td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: 999,
                        fontSize: '.67rem', fontWeight: 700, background: '#feecec', color: '#922b21',
                      }}>{req}</span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 12px', fontSize: '.76rem', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
              💡 Tip: Both sheets can be in the <em>same</em> master Excel file.
            </div>
          </div>
        </div>

        {masterStatus && <Alert variant={masterStatus.type}>{masterStatus.msg}</Alert>}
      </Card>
    </div>
  );
}
