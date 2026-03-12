const IMAGE_EXTENSIONS = new Set(
  [".jpg", ".jpeg", ".png", ".gif", ".webp"].map((e) => e.toLowerCase())
);

function isImageFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return [...IMAGE_EXTENSIONS].some((ext: string) => lower.endsWith(ext));
}

/**
 * List image file names (flat) from the given directory handle.
 * Returns paths that can be used with resolveImageUrl(path, dirHandle).
 */
export async function listImageFiles(
  dirHandle: FileSystemDirectoryHandle
): Promise<string[]> {
  const names: string[] = [];
  const entries = (dirHandle as unknown as { entries(): AsyncIterableIterator<[string, FileSystemHandle]> }).entries();
  for await (const [name, handle] of entries) {
    if (handle.kind === "file" && isImageFilename(name)) {
      names.push(name);
    }
  }
  return names.sort();
}
