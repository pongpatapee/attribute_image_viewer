import Papa from "papaparse";

const DATA_IMAGE_COLUMN = "data_image";

export type CsvRow = Record<string, string>;

export interface ParseResult {
  rows: CsvRow[];
  headers: string[];
  error?: string;
}

/**
 * Parse a CSV file and return rows and all headers.
 */
export function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as CsvRow[];
        if (rows.length === 0) {
          resolve({
            rows: [],
            headers: [],
            error: "CSV has no data rows.",
          });
          return;
        }
        const headers = Object.keys(rows[0]);
        resolve({ rows, headers });
      },
      error(err) {
        resolve({
          rows: [],
          headers: [],
          error: err.message ?? "Failed to parse CSV.",
        });
      },
    });
  });
}

/**
 * Headers suitable for column selection (all except data_image).
 */
export function getAttributeHeaders(headers: string[]): string[] {
  return headers.filter((h) => h !== DATA_IMAGE_COLUMN);
}
