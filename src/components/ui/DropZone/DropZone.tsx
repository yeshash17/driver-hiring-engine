import { useRef, useState, type DragEvent } from 'react';
import styles from './DropZone.module.scss';

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  icon?: string;
  heading?: string;
  hint?: string;
}

export function DropZone({
  onFile,
  accept = '.xlsx,.xls',
  icon = '📊',
  heading = 'Drop a file here',
  hint,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setOver(true);
  };
  const handleDragLeave = () => setOver(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`${styles.drop} ${over ? styles.over : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { onFile(file); e.target.value = ''; }
        }}
      />
      <div className={styles.icon}>{icon}</div>
      <div className={styles.heading}>{heading}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
