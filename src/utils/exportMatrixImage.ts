import html2canvas from "html2canvas";

const EXPORT_BACKGROUND = "#1a1a1a";

/** Parse hex color to r,g,b (0-255). */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Crop canvas to the bounding box of pixels that differ from the background color.
 * Uses a small tolerance so near-background pixels are treated as background.
 */
function cropCanvasToContent(
  canvas: HTMLCanvasElement,
  backgroundColor: string,
  tolerance = 20
): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const [br, bg, bb] = hexToRgb(backgroundColor);
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const diff =
        Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
      if (a > 10 && diff > tolerance) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) return canvas;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const cropCtx = cropped.getContext("2d");
  if (!cropCtx) return canvas;
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return cropped;
}

/**
 * Capture an HTML element as a PNG and trigger a download.
 * Uses html2canvas to render the DOM (including images, styles) to a canvas.
 * Crops the result to content bounds to avoid excess empty space.
 */
export async function exportElementToPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const originalWidth = element.style.width;
  const originalHeight = element.style.height;
  const originalOverflow = element.style.overflow;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.overflow = "visible";

  const cells = element.querySelectorAll<HTMLElement>("[data-export-cell]");
  const cellOverflows: string[] = [];
  cells.forEach((el) => {
    cellOverflows.push(el.style.overflow);
    el.style.overflow = "visible";
  });

  let canvas;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      allowTaint: true,
      backgroundColor: EXPORT_BACKGROUND,
      width: rect.width,
      height: rect.height,
    });
  } finally {
    cells.forEach((el, i) => {
      el.style.overflow = cellOverflows[i] ?? "";
    });
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.overflow = originalOverflow;
  }

  canvas = cropCanvasToContent(canvas, EXPORT_BACKGROUND);

  const name = filename.endsWith(".png") ? filename : `${filename}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      },
      "image/png",
      1
    );
  });
}
