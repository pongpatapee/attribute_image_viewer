import { useState, useCallback, useEffect } from "react";
import { CsvUpload } from "./components/CsvUpload";
import { ColumnSelector } from "./components/ColumnSelector";
import { ImageViewer } from "./components/ImageViewer";
import { revokeObjectUrlCache } from "./utils/images";
import type { CsvRow } from "./utils/csv";
import "./App.css";

function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [attributeHeaders, setAttributeHeaders] = useState<string[]>([]);
  const [col1, setCol1] = useState<string | null>(null);
  const [col2, setCol2] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [imageDirHandle, setImageDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const handleCsvData = useCallback((newRows: CsvRow[], headers: string[]) => {
    setRows(newRows);
    setAttributeHeaders(headers);
    setCsvError(null);
    setCol1(null);
    setCol2(null);
  }, []);

  const supportsDirectoryPicker = typeof window !== "undefined" && "showDirectoryPicker" in window;

  useEffect(() => {
    return () => revokeObjectUrlCache();
  }, []);
  useEffect(() => {
    revokeObjectUrlCache();
  }, [imageDirHandle]);

  return (
    <div className="app">
      <aside className="panel" aria-label="CSV and column selection">
        <h1 className="title">Attribute Image Viewer</h1>
        <CsvUpload
          onData={handleCsvData}
          onError={setCsvError}
          onImageFolderSelected={setImageDirHandle}
          supportsDirectoryPicker={!!supportsDirectoryPicker}
        />
        {csvError && <p className="error">{csvError}</p>}
        {attributeHeaders.length > 0 && (
          <>
            <ColumnSelector
              label="Column 1"
              options={attributeHeaders}
              value={col1}
              onChange={setCol1}
              aria-label="Select first attribute column"
            />
            <ColumnSelector
              label="Column 2"
              options={attributeHeaders}
              value={col2}
              onChange={setCol2}
              aria-label="Select second attribute column"
            />
          </>
        )}
      </aside>
      <main className="main" role="main" aria-live="polite">
        {rows.length === 0 && !csvError && (
          <p className="placeholder" id="main-message">
            Upload a CSV and select columns to view the image matrix.
          </p>
        )}
        {rows.length > 0 && (!col1 || !col2) && (
          <p className="placeholder" id="main-message">
            Select both Column 1 and Column 2 to see the image matrix.
          </p>
        )}
        {rows.length > 0 && col1 && col2 && (
          <>
            {!imageDirHandle && (
              <p className="hint" role="status">
                For local file paths, use &quot;Select image folder&quot; above. URL or / paths work without it.
              </p>
            )}
            <ImageViewer
              rows={rows}
              col1={col1}
              col2={col2}
              imageRoot={imageDirHandle}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
