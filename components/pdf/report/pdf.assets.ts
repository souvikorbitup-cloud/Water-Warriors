export const PDF_ASSET_PATHS = {
  logo: "/pdf-images/water-warriors-logo.svg",
  house: "/pdf-images/house-dot.svg",
  rain: "/pdf-images/rain-dot.svg",
  drop: "/pdf-images/water-drop-dot.png",
  family: "/pdf-images/family-dot.png",
  trees: "/pdf-images/trees-dot.png",
  truck: "/pdf-images/truck-dot.png",
  savings: "/pdf-images/savings-dot.png",
  bulb: "/pdf-images/bulb.svg",
  rainCollect: "/section-images/rain-collect.png",
  divider: "/section-images/report-divider-img.png",
  gradient: "/pdf-images/gradent-bg.png",
} as const;

export type PdfAssetKey = keyof typeof PDF_ASSET_PATHS;
export type PdfAssets = Partial<Record<PdfAssetKey, string>>;

/** Returns the pre-rasterized asset if available, otherwise the public path. */
export function resolveAsset(
  assets: PdfAssets | undefined,
  key: PdfAssetKey,
): string {
  return assets?.[key] ?? PDF_ASSET_PATHS[key];
}

/**
 * @react-pdf/renderer's <Image> only supports PNG / JPG, so SVGs are drawn to
 * a canvas and converted to PNG data URLs. Browser only.
 */
function rasterizeSvg(url: string, maxSide = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const naturalW = img.naturalWidth || 128;
      const naturalH = img.naturalHeight || 128;
      const ratio = maxSide / Math.max(naturalW, naturalH);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(naturalW * ratio);
      canvas.height = Math.round(naturalH * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

let assetsPromise: Promise<PdfAssets> | null = null;

/**
 * Call once before rendering the PDF and put the result on `data.assets`.
 * Assets that fail to convert silently fall back to their public path.
 */
export function loadPdfAssets(): Promise<PdfAssets> {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const entries = await Promise.all(
        (Object.entries(PDF_ASSET_PATHS) as [PdfAssetKey, string][])
          .filter(([, path]) => path.endsWith(".svg"))
          .map(async ([key, path]) => {
            try {
              return [key, await rasterizeSvg(path)] as const;
            } catch {
              return null;
            }
          }),
      );
      const assets: PdfAssets = {};
      for (const entry of entries) {
        if (entry) assets[entry[0]] = entry[1];
      }
      return assets;
    })();
  }
  return assetsPromise;
}
