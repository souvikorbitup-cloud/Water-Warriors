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

  mapImageUrl: string | null;
  rechargeBannerUrl: string;

  overview: {
    catchmentLabel: string;
    catchmentArea: string;
    rainfallLabel: string;
    annualRainfall: string;
    potentialTitle: string;
    potentialDescription: string;
    potentialValue: string;
    potentialInWords?: string;
    calculation?: string;
    source?: string;
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
