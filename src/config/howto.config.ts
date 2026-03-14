export type StepType = 'auto' | 'manual' | 'crit';

export interface HowToStep {
  n: string;
  t: StepType;
  title: string;
  desc: string;
  note: string;
}

export interface HowToPhase {
  col: string;
  bg: string;
  lbl: string;
  title: string;
  sub: string;
  steps: HowToStep[];
}

export const HOW_TO_PHASES: HowToPhase[] = [
  {
    col: '#1e6091', bg: '#e8f3fd', lbl: 'SETUP',
    title: 'One-time Setup',
    sub: 'Do this once when you first start, or whenever staff / fleet changes significantly',
    steps: [
      { t: 'auto',   n: 'S1', title: 'Upload MP-inputs.xlsm',       desc: 'Go to <strong>⚙ Optimizer Inputs</strong> in the left sidebar. Drop your MP-inputs.xlsm file. All 13 sheets are parsed automatically — parameters, employees, cars, branches, villas, matrices and demand.', note: 'Takes ~5 seconds' },
      { t: 'auto',   n: 'S2', title: 'Review model parameters',      desc: 'Check shift hours, OT rates, planning horizon, travel deviation. These rarely need changing — verify once per quarter or when policy changes.', note: '⚙ Optimizer Inputs → Parameters tab' },
      { t: 'manual', n: 'S3', title: 'Set active cities',            desc: 'Toggle which cities should be included in this run. Only <strong>Yes</strong> cities are optimized. If you are running Riyadh only, keep all others set to No.', note: 'Manual — depends on coverage plan' },
      { t: 'crit',   n: 'S4', title: 'Verify employee roster',       desc: 'Add new joiners, mark leavers for removal, update driving licenses. <strong>This is the most critical manual step</strong> — wrong roster data propagates errors through the entire output.', note: '👥 Master Data → Employees tab' },
      { t: 'crit',   n: 'S5', title: 'Verify car fleet',             desc: 'Add new vehicles, remove retired cars, update rental and running costs. Every car must be assigned to the correct villa.', note: '👥 Master Data → Cars tab' },
      { t: 'crit',   n: 'S6', title: 'Assign all branches to villas',desc: 'Every DELIVERY branch must have a villa assigned. Unassigned branches will cause the optimizer to fail silently or produce wrong routes.', note: '👥 Master Data → Branches tab' },
      { t: 'auto',   n: 'S7', title: 'Run validation check',         desc: 'Go to the Validation tab. All three sections (Parameters, Master Data, Demand) must show green before proceeding. Fix any issues flagged in red.', note: '⚙ Optimizer Inputs → Validation tab' },
    ],
  },
  {
    col: '#8e44ad', bg: '#f4eaff', lbl: 'WEEKLY',
    title: 'Weekly Demand',
    sub: 'Do this at the start of every planning cycle — usually once per week',
    steps: [
      { t: 'crit',   n: 'W1', title: 'Export demand from QuickSight',desc: 'In QuickSight, run the staffing requirements report and export it as Excel or CSV. The file must contain: <code>Branch, Hour, Weekday, Req. staffing</code> columns — same structure as the PLAN_STAFF sheet.', note: 'Done in QuickSight — outside ShiftHQ' },
      { t: 'auto',   n: 'W2', title: 'Upload demand to ShiftHQ',     desc: 'Go to <strong>⚙ Optimizer Inputs → Weekly Demand</strong> tab and upload the QuickSight export. The system automatically maps it to the correct branches.', note: 'Takes ~3 seconds to parse' },
      { t: 'manual', n: 'W3', title: 'Review the demand heatmap',    desc: 'Check the Branch × Day heatmap for unusual spikes, missing branches, or obviously wrong numbers. Flag anything suspicious before running — bad demand = bad schedule.', note: 'Visual check — 2–3 minutes' },
      { t: 'auto',   n: 'W4', title: 'Re-run validation',            desc: 'After loading new demand, click the Validation tab again to confirm all active branches have demand data and there are no new issues.', note: '⚙ Optimizer Inputs → Validation tab' },
    ],
  },
  {
    col: '#e67e22', bg: '#fff8f0', lbl: 'RUN',
    title: 'Run Optimization',
    sub: 'Produce the weekly schedule from the prepared inputs',
    steps: [
      { t: 'auto', n: 'R1', title: 'Download MP-inputs.xlsx',          desc: 'Go to <strong>⚙ Optimizer Inputs → Export</strong> tab. Click "Download MP-inputs.xlsx". The file is fully assembled from all your edits — all 13 sheets are included.', note: 'Instant download' },
      { t: 'crit', n: 'R2', title: 'Copy file to optimizer folder',    desc: 'Replace the existing <code>MP-inputs.xlsx</code> in your Python optimizer folder with the downloaded file. Do not rename it.', note: 'Manual file copy — critical' },
      { t: 'crit', n: 'R3', title: 'Run run_optimizer.bat',           desc: 'Double-click <strong>run_optimizer.bat</strong>. A command window opens and runs the solver. Do not close the window until it says "Done" or "Finished". Premature exit = incomplete output.', note: '3–15 min depending on scope' },
      { t: 'crit', n: 'R4', title: 'Collect shifts_and_trips.xlsx',   desc: 'When the solver finishes, find <strong>shifts_and_trips.xlsx</strong> in the designated output folder. Check that the file modification date matches today.', note: 'Manual — check output folder' },
    ],
  },
  {
    col: '#14b889', bg: '#eafbf3', lbl: 'REVIEW',
    title: 'Review & Replace',
    sub: 'Manager review and correction of the generated schedule',
    steps: [
      { t: 'auto',   n: 'V1', title: 'Upload shifts_and_trips.xlsx', desc: 'Go to <strong>⬆ Upload</strong> in the left sidebar. Enter the week label (e.g. WK32) and year, then upload the output file. It is parsed in seconds.', note: '⬆ Upload page' },
      { t: 'auto',   n: 'V2', title: 'Check the Dashboard',          desc: 'The Dashboard shows a summary of flagged issues: floaters, cross-manager staff, unlicensed drivers, dummy IDs. Review this before diving into the detail.', note: '🏠 Dashboard' },
      { t: 'crit',   n: 'V3', title: 'Fix flagged employees',        desc: 'Go to <strong>🛠 Review & Replace</strong>. For each flagged employee, search for a replacement using the searchable dropdown. You can swap a single shift or the entire week. Requires manager judgment.', note: 'Manual — requires manager knowledge' },
      { t: 'manual', n: 'V4', title: 'Review driver assignments',    desc: 'Go to <strong>🚗 Driver Review</strong>. Replace any driver flagged as unlicensed or reassigned. Every car must have a valid licensed driver.', note: 'Manual — driving license verification' },
      { t: 'auto',   n: 'V5', title: 'View Schedule Matrix',         desc: 'Use <strong>📋 Schedule Matrix</strong> to see a clean timetable view — by employee or by branch. Export to Excel to share with branch managers. This is the schedule employees will receive.', note: 'Optional but recommended' },
      { t: 'crit',   n: 'V6', title: 'Lock the week',               desc: 'Once all replacements and driver assignments are confirmed, click <strong>🔒 Lock</strong> in the top bar. This prevents accidental edits. You can unlock if further changes are needed.', note: 'Final approval — manager sign-off' },
    ],
  },
  {
    col: '#e74c3c', bg: '#feecec', lbl: 'EXPORT',
    title: 'Export to Dawamy',
    sub: 'Finalize the schedule and push to payroll / attendance system',
    steps: [
      { t: 'auto',   n: 'E1', title: 'Export reviewed workbook', desc: 'Click <strong>⬇ Export Reviewed File</strong> in the top bar for the full villa export, or use the branch-level export in Review & Replace to generate per-branch files for each manager.', note: 'Instant download' },
      { t: 'crit',   n: 'E2', title: 'Upload to Dawamy',         desc: "Log into the Dawamy portal and upload the exported file. Follow Dawamy's import process exactly — wrong column format will cause rejection. Confirm the upload is accepted.", note: 'Manual — Dawamy portal login required' },
      { t: 'manual', n: 'E3', title: 'Confirm and archive',      desc: 'After Dawamy confirms the import, note the completed week in the <strong>📅 Week History</strong> tab. Keep the ShiftHQ week locked as a permanent record.', note: 'Manual verification' },
    ],
  },
];
