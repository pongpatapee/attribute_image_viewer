import { useState, useEffect, useMemo } from "react";
import { listImageFiles } from "../utils/imageFolder";
import { resolveImageUrl } from "../utils/images";
import type { CsvRow } from "../utils/csv";
import styles from "./ImageRowMapping.module.css";

function ImageThumb({
  path,
  imageRoot,
  selected,
  onClick,
}: {
  path: string;
  imageRoot: FileSystemDirectoryHandle;
  selected: boolean;
  onClick: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveImageUrl(path, imageRoot).then((resolved) => {
      if (!cancelled) {
        setUrl(resolved || null);
        setFailed(!resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path, imageRoot]);

  return (
    <button
      type="button"
      className={selected ? styles.thumbButtonSelected : styles.thumbButton}
      onClick={onClick}
      title={path}
      aria-label={`Assign ${path} to selected row`}
    >
      {failed || !url ? (
        <span className={styles.thumbPlaceholder}>?</span>
      ) : (
        <img src={url} alt="" className={styles.thumbImg} loading="lazy" />
      )}
      <span className={styles.thumbName}>{path}</span>
    </button>
  );
}

export interface ImageRowMappingProps {
  rows: CsvRow[];
  headers: string[];
  imageRoot: FileSystemDirectoryHandle;
  rowToImagePath: Record<number, string>;
  onMappingChange: (rowIndex: number, path: string) => void;
  onComplete: () => void;
}

export function ImageRowMapping({
  rows,
  headers,
  imageRoot,
  rowToImagePath,
  onMappingChange,
  onComplete,
}: ImageRowMappingProps) {
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listImageFiles(imageRoot).then((paths) => {
      if (!cancelled) {
        setImagePaths(paths);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imageRoot]);

  const unmappedIndices = useMemo(
    () => rows.map((_, i) => i).filter((i) => !rowToImagePath[i]),
    [rows.length, rowToImagePath]
  );
  const allMapped = unmappedIndices.length === 0;

  const goToNextUnmapped = () => {
    if (unmappedIndices.length === 0) return;
    const idx = unmappedIndices.indexOf(selectedRowIndex);
    const next = idx < 0 ? unmappedIndices[0] : unmappedIndices[(idx + 1) % unmappedIndices.length];
    setSelectedRowIndex(next);
  };

  const handleAssignImage = (path: string) => {
    if (selectedRowIndex === null) return;
    onMappingChange(selectedRowIndex, path);
    const nextUnmapped = unmappedIndices.filter((i) => i !== selectedRowIndex);
    if (nextUnmapped.length > 0) {
      setSelectedRowIndex(nextUnmapped[0]);
    }
  };

  return (
    <div className={styles.wrapper} role="region" aria-label="Map images to CSV rows">
      <div className={styles.layout}>
        <div className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>CSV rows</h2>
          <p className={styles.instruction}>
            Select a row, then click an image to assign it. Use &quot;Next unmapped&quot; to jump.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                  <th scope="col">Image</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      selectedRowIndex === i
                        ? rowToImagePath[i]
                          ? styles.rowSelectedMapped
                          : styles.rowSelected
                        : rowToImagePath[i]
                          ? styles.rowMapped
                          : undefined
                    }
                    onClick={() => setSelectedRowIndex(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRowIndex(i);
                      }
                    }}
                    aria-pressed={selectedRowIndex === i}
                    aria-label={`Row ${i + 1}, ${rowToImagePath[i] ? `mapped to ${rowToImagePath[i]}` : "not mapped"}`}
                  >
                    <td className={styles.cellIndex}>{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className={styles.cell}>
                        {row[h] ?? ""}
                      </td>
                    ))}
                    <td className={styles.cellImage}>
                      {rowToImagePath[i] ? (
                        <span className={styles.mappedLabel} title={rowToImagePath[i]}>
                          {rowToImagePath[i]}
                        </span>
                      ) : (
                        <span className={styles.unmappedLabel}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={goToNextUnmapped}
              disabled={unmappedIndices.length === 0}
            >
              Next unmapped
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={onComplete}
              disabled={!allMapped}
            >
              Continue
            </button>
          </div>
        </div>
        <div className={styles.imagesSection}>
          <h2 className={styles.sectionTitle}>Images</h2>
          {loading ? (
            <p className={styles.loading}>Loading images…</p>
          ) : imagePaths.length === 0 ? (
            <p className={styles.empty}>No image files in this folder.</p>
          ) : (
            <div className={styles.thumbGrid}>
              {imagePaths.map((path) => (
                <ImageThumb
                  key={path}
                  path={path}
                  imageRoot={imageRoot}
                  selected={false}
                  onClick={() => handleAssignImage(path)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
