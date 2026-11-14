import type { PdfAssets } from "./pdf.assets";

export type PdfQuality = "standard" | "high";

export interface PdfImpactItem {
  label: string;
  value: string;
  note: string;
}

export interface PdfForecastRow {
  month: string;
  rainfall: string;
  potential: string;
  highlight?: boolean;
}

export interface WaterWarriorsPdfData {
  locale: string;
  greeting: string;
  thankYou: string;
  customerName: string;
  location: string;

  /** Optional top strip text (defaults to the patent notice). */
  notice?: string;

  mapImageUrl: string | null;
  rechargeBannerUrl: string;

  /** Output of loadPdfAssets(); omit to use the raw public paths. */
  assets?: PdfAssets;

  overview: {
    catchmentLabel: string;
    catchmentArea: string;
    rainfallLabel: string;
    annualRainfall: string;
    potentialTitle: string;
    potentialDescription: string;
    /** Small label above the yellow value pill (falls back to catchmentLabel). */
    potentialLabel?: string;
    potentialValue: string;
    potentialInWords?: string;
    calculation?: string;
    source?: string;
    imageCaption?: string;
  };

  impact: {
    title: string;
    description: string;
    items: PdfImpactItem[];
    assumptions: string;
  };

  recharge: {
    title: string;
    introduction: string;
    paragraphs: string[];
  };

  forecast: {
    title: string;
    period: string;
    monthLabel: string;
    rainfallLabel: string;
    potentialLabel: string;
    pendingLabel: string;
    rows: PdfForecastRow[];
    tip: string;
    note: string;
    source: string;
    disclaimer: string;
  };
}
