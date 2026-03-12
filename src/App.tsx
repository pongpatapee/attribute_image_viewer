import { useState, useCallback, useEffect } from "react";
import { CsvUpload } from "./components/CsvUpload";
import { ColumnSelector } from "./components/ColumnSelector";
import { ImageRowMapping } from "./components/ImageRowMapping";
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
  const [rowToImagePath, setRowToImagePath] = useState<Record<number, string>>({});
  const [mappingComplete, setMappingComplete] = useState(false);

  const handleCsvData = useCallback((newRows: CsvRow[], headers: string[]) => {
    setRows(newRows);
    setAttributeHeaders(headers);
    setCsvError(null);
    setCol1(null);
    setCol2(null);
    setRowToImagePath({});
    setMappingComplete(false);
  }, []);

  const handleImageFolderSelected = useCallback((handle: FileSystemDirectoryHandle) => {
    setImageDirHandle(handle);
    setRowToImagePath({});
    setMappingComplete(false);
  }, []);

  const handleMappingChange = useCallback((rowIndex: number, path: string) => {
    setRowToImagePath((prev) => ({ ...prev, [rowIndex]: path }));
  }, []);

  const handleMappingComplete = useCallback(() => {
    setMappingComplete(true);
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
          onImageFolderSelected={handleImageFolderSelected}
          supportsDirectoryPicker={!!supportsDirectoryPicker}
        />
        {csvError && <p className="error">{csvError}</p>}
        {attributeHeaders.length > 0 && mappingComplete && (
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
            Upload a CSV and select an image folder to get started.
          </p>
        )}
        {rows.length > 0 && !imageDirHandle && (
          <p className="placeholder" id="main-message">
            Select image folder to continue to the mapping step.
          </p>
        )}
        {rows.length > 0 && imageDirHandle && !mappingComplete && (
          <ImageRowMapping
            rows={rows}
            headers={attributeHeaders}
            imageRoot={imageDirHandle}
            rowToImagePath={rowToImagePath}
            onMappingChange={handleMappingChange}
            onComplete={handleMappingComplete}
          />
        )}
        {rows.length > 0 && imageDirHandle && mappingComplete && (
          <>
            {(!col1 || !col2) && (
              <p className="placeholder" id="main-message">
                Select both Column 1 and Column 2 to see the image matrix.
              </p>
            )}
            {col1 && col2 && (
              <ImageViewer
                rows={rows}
                rowToImagePath={rowToImagePath}
                col1={col1}
                col2={col2}
                imageRoot={imageDirHandle}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
