/**
 * Normalize path separators to / and trim.
 */
function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/");
}

/**
 * Check if path should be used as-is (URL or root-relative).
 */
function isAbsoluteOrUrl(path: string): boolean {
  const p = path.trim();
  return p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/");
}

const objectUrlCache = new Map<string, string>();

/**
 * Revoke all cached object URLs (call when directory changes or on unmount).
 */
export function revokeObjectUrlCache(): void {
  objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
  objectUrlCache.clear();
}

/**
 * Get a file from a directory handle by path (e.g. "sub/folder/image.jpg").
 * Walks nested directories; returns the File for the final segment.
 */
async function getFileFromPath(
  dirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<File> {
  const parts = normalizePath(path).split("/").filter(Boolean);
  if (parts.length === 0) throw new Error("Empty path");
  let current: FileSystemDirectoryHandle | FileSystemFileHandle = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await (current as FileSystemDirectoryHandle).getDirectoryHandle(parts[i]);
  }
  const fileHandle = await (current as FileSystemDirectoryHandle).getFileHandle(parts[parts.length - 1]);
  return fileHandle.getFile();
}

export type ImageRoot = FileSystemDirectoryHandle | null;

/**
 * Resolve a data_image value to a URL that can be used as img src.
 * - If path is URL or starts with /, return as-is.
 * - If imageRoot is a directory handle, resolve path relative to it and return object URL (cached).
 */
export async function resolveImageUrl(
  path: string,
  imageRoot: ImageRoot
): Promise<string> {
  const normalized = normalizePath(path);
  if (isAbsoluteOrUrl(normalized)) {
    return normalized;
  }
  if (!imageRoot) {
    return "";
  }
  const cacheKey = normalized;
  const cached = objectUrlCache.get(cacheKey);
  if (cached) return cached;
  try {
    const file = await getFileFromPath(imageRoot, normalized);
    const url = URL.createObjectURL(file);
    objectUrlCache.set(cacheKey, url);
    return url;
  } catch {
    return "";
  }
}
