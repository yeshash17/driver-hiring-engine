import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseScheduleWorkbook } from '../utils/excel.utils';
import { getVillas } from '../utils/schedule.utils';

export function useFileParser() {
  const { setWeek, setActiveWeek, setVilla, db } = useAppStore();

  const handleScheduleFile = useCallback(
    async (
      file: File,
      label: string,
      year: string,
      onSuccess: (msg: string) => void,
      onError: (msg: string) => void
    ) => {
      try {
        const { wk, key } = await parseScheduleWorkbook(file, label, year);
        setWeek(key, wk);
        setActiveWeek(key);
        const villas = getVillas(wk);
        setVilla(villas[0] ?? null);
        onSuccess(
          `Loaded ${wk.label} — ${wk.base.emp.length} employee rows, ${wk.base.car.length} car rows, ${wk.base.br.length} branch-hour rows.`
        );
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err));
      }
    },
    [setWeek, setActiveWeek, setVilla]
  );

  const handleMasterFile = useCallback(
    async (
      file: File,
      wkKey: string,
      onSuccess: () => void,
      onError: (msg: string) => void
    ) => {
      const wk = db.weeks[wkKey];
      if (!wk) { onError('No week selected'); return; }
      try {
        // parse into a clone and then setWeek
        const { parseMasterWorkbook: parse } = await import('../utils/excel.utils');
        const cloned = JSON.parse(JSON.stringify(wk));
        await parse(file, cloned);
        setWeek(wkKey, cloned);
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err));
      }
    },
    [db.weeks, setWeek]
  );

  return { handleScheduleFile, handleMasterFile };
}
