import { useState, useEffect } from "react";
import { resolveImageUrl, type ImageRoot } from "../utils/images";
import type { CsvRow } from "../utils/csv";
import styles from "./ImageViewer.module.css";

function distinctValues(rows: CsvRow[], column: string): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const v = row[column];
    if (v != null && v.trim() !== "") set.add(v.trim());
  }
  return Array.from(set);
}

function rowsForCell(
  rows: CsvRow[],
  col1: string,
  col2: string,
  v1: string,
  v2: string
): CsvRow[] {
  return rows.filter(
    (r) => r[col1]?.trim() === v1 && r[col2]?.trim() === v2
  );
}

interface CellImageProps {
  path: string;
  imageRoot: ImageRoot;
}

function CellImage({ path, imageRoot }: CellImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!path.trim()) {
      setUrl(null);
      return;
    }
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

  if (failed || !url) {
    return (
      <div className={styles.placeholder} title={path}>
        <span className={styles.placeholderIcon} aria-hidden>⌷</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={styles.thumb}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export interface ImageViewerProps {
  rows: CsvRow[];
  col1: string;
  col2: string;
  imageRoot: ImageRoot;
}

export function ImageViewer({ rows, col1, col2, imageRoot }: ImageViewerProps) {
  const col1Values = distinctValues(rows, col1);
  const col2Values = distinctValues(rows, col2);

  return (
    <div className={styles.wrapper} role="region" aria-label="Image matrix by selected attributes">
      <div className={styles.grid} aria-label={`Matrix: ${col1} (columns) by ${col2} (rows)`}>
        <div className={styles.corner}>
          <span className={styles.axisLabel}>Column 1</span>
        </div>
        <div className={styles.colHeaders}>
          {col1Values.map((v) => (
            <div key={v} className={styles.colHeaderCell}>
              {v}
            </div>
          ))}
        </div>
        <div className={styles.rowLabelBlock}>
          <span className={styles.axisLabelVertical}>Column 2</span>
          <div className={styles.rowLabels}>
            {col2Values.map((v) => (
              <div key={v} className={styles.rowLabelCell}>
                {v}
              </div>
            ))}
          </div>
        </div>
        <div
          className={styles.cells}
          style={{
            gridTemplateColumns: `repeat(${col1Values.length}, 140px)`,
            gridTemplateRows: `repeat(${col2Values.length}, minmax(100px, auto))`,
          }}
        >
          {col2Values.map((v2) =>
            col1Values.map((v1) => {
              const cellRows = rowsForCell(rows, col1, col2, v1, v2);
              const paths = cellRows
                .map((r) => r["data_image"])
                .filter((p) => p != null && p.trim() !== "");
              return (
                <div key={`${v1}-${v2}`} className={styles.cell}>
                  {paths.length === 0 ? (
                    <div className={styles.emptyCell}>No images</div>
                  ) : (
                    <div className={styles.thumbs}>
                      {paths.map((p, i) => (
                        <CellImage key={`${p}-${i}`} path={p} imageRoot={imageRoot} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
