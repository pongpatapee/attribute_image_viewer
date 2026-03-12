import { useRef } from "react";
import { parseCsv, getAttributeHeaders, type CsvRow } from "../utils/csv";
import styles from "./CsvUpload.module.css";

export interface CsvUploadProps {
  onData: (rows: CsvRow[], attributeHeaders: string[]) => void;
  onError: (message: string) => void;
  onImageFolderSelected?: (handle: FileSystemDirectoryHandle) => void;
  supportsDirectoryPicker: boolean;
}

export function CsvUpload({
  onData,
  onError,
  onImageFolderSelected,
  supportsDirectoryPicker,
}: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseCsv(file);
    if (result.error) {
      onError(result.error);
      return;
    }
    const attributeHeaders = getAttributeHeaders(result.headers);
    onData(result.rows, attributeHeaders);
    e.target.value = "";
  };

  const handleSelectFolder = async () => {
    if (!("showDirectoryPicker" in window) || !onImageFolderSelected) return;
    try {
      const handle = await (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
      onImageFolderSelected(handle);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        onError("Could not access folder: " + err.message);
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <label className={styles.label}>Upload CSV</label>
        <button
          type="button"
          className={styles.button}
          onClick={() => inputRef.current?.click()}
        >
          Select files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          aria-label="Choose CSV file"
        />
      </div>
      {supportsDirectoryPicker && onImageFolderSelected && (
        <div className={styles.section}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={handleSelectFolder}
          >
            Select image folder
          </button>
          <p className={styles.help}>
            Images from this folder will be mapped to CSV rows in the next step.
          </p>
        </div>
      )}
      {!supportsDirectoryPicker && (
        <p className={styles.help}>
          For local image paths, use a browser that supports folder selection,
          or use URL/root-relative paths (e.g. /img/photo.jpg).
        </p>
      )}
    </div>
  );
}
