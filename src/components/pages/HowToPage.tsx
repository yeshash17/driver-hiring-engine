import { HOW_TO_PHASES } from '../../config/howto.config';
import type { StepType } from '../../config/howto.config';
import { Card, CardHeader, CardTitle, Alert, Button } from '../ui/index';
import styles from './HowToPage.module.scss';

function badgeLabel(t: StepType) {
  return t === 'auto' ? '🤖 Automated' : '✋ Manual';
}

export function HowToPage() {
  return (
    <div className={styles.howto}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>📖 How to Use ShiftHQ — Complete Workflow Guide</CardTitle>
            <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 3 }}>
              TOPS Optimizer pipeline: Demand → Inputs → Optimization → Review → Dawamy
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>🖨 Print guide</Button>
        </CardHeader>

        {/* Legend */}
        <div className={styles.legend}>
          {[
            { color: 'var(--green)', label: 'Automated by ShiftHQ or optimizer' },
            { color: 'var(--amber)', label: 'Manual action required' },
            { color: 'var(--red)',   label: 'Critical — errors here affect the full output' },
          ].map(({ color, label }) => (
            <div key={label} className={styles.legendItem}>
              <div className={styles.legendBar} style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        <Alert variant="info">
          This guide covers the <strong>full weekly cycle</strong>. Steps marked{' '}
          <strong>✋ Manual</strong> require human action outside the app. Steps marked{' '}
          <strong>🤖 Automated</strong> are handled by ShiftHQ or the optimizer automatically.
          Steps marked <strong>⚠ Critical</strong> will produce wrong results downstream if skipped or done incorrectly.
        </Alert>
      </Card>

      {/* Phases */}
      {HOW_TO_PHASES.map((ph) => (
        <div key={ph.lbl} className={styles.phase}>
          <div className={styles.phaseHeader} style={{ background: ph.bg }}>
            <div className={styles.phaseNum} style={{ background: ph.col }}>{ph.lbl}</div>
            <div>
              <div className={styles.phaseTitle} style={{ color: ph.col }}>{ph.title}</div>
              <div className={styles.phaseSub}>{ph.sub}</div>
            </div>
          </div>
          <div className={styles.steps}>
            {ph.steps.map((s) => (
              <div key={s.n} className={`${styles.step} ${styles[s.t]}`}>
                <div className={styles.stepNum}>{s.n}</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepTitle}>
                    {s.title}
                    {s.t === 'crit' && (
                      <span style={{ color: 'var(--red)', fontSize: '.72rem', fontWeight: 700, marginLeft: 6 }}>
                        ⚠ Critical
                      </span>
                    )}
                  </div>
                  <div
                    className={styles.stepDesc}
                    dangerouslySetInnerHTML={{ __html: s.desc }}
                  />
                  <span className={`${styles.badge} ${s.t === 'auto' ? styles.auto : styles.manual}`}>
                    {badgeLabel(s.t)}
                  </span>
                  <span className={`${styles.badge} ${styles.note}`}>{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Checklist */}
      <Card style={{ marginTop: 24 }}>
        <CardHeader>
          <CardTitle>📋 Quick Weekly Checklist</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>🖨 Print</Button>
        </CardHeader>
        <div style={{ fontSize: '.76rem', color: 'var(--muted)', marginBottom: 14 }}>
          Print this checklist and physically tick each box during your weekly cycle.
          Boxes with a red border are critical steps.
        </div>
        <div className={styles.checklist}>
          {HOW_TO_PHASES.map((ph) => (
            <div key={ph.lbl} className={styles.checklistPhase}>
              <div
                className={styles.checklistPhaseHeader}
                style={{ background: ph.bg, color: ph.col }}
              >
                {ph.lbl}: {ph.title}
              </div>
              {ph.steps.map((s) => (
                <div key={s.n} className={styles.checklistItem}>
                  <div className={`${styles.checkbox} ${styles[s.t]}`} />
                  <div>
                    <div className={styles.checkText}>{s.n}. {s.title}{s.t === 'crit' ? ' ⚠' : ''}</div>
                    <div className={styles.checkNote}>{s.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
