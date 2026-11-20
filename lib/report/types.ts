export type ReportPoint = {
  lat: number;
  lng: number;
};

export type RooftopSelection = {
  name: string;
  points: ReportPoint[];
  zoom: number;
};

export type ReportStatus =
  | "pending"
  | "generating"
  | "retrying"
  | "ready"
  | "failed";

export type ReportStepStatus = "pending" | "complete" | "failed";
export type ReportLocale = "en" | "hi";

export type ReportLocation = {
  locality: string;
  city: string;
  district: string;
  state: string;
  countryCode: string;
};

export type ReportForecastMonth = {
  month: string;
  monthStart: string;
  rainfallMm: number;
  harvestableLitres: number;
};

export type ReportAnalysisResult = {
  analysis: string[];
  waterValueRupeesPerKilolitre?: number;
};

export type ReportSessionData = {
  orderId: string;
  status: ReportStatus;
  customerName: string;
  selection: RooftopSelection;
  areaSqm: number;
  centroid: ReportPoint;
  runoffCoefficient: number;
  annualRainfallMm?: number;
  potentialLitres?: number;
  location?: ReportLocation;
  analysis?: string[];
  analysisLocale?: ReportLocale;
  waterValueRupeesPerKilolitre?: number;
  waterValueIsLocationBased?: boolean;
  forecast?: ReportForecastMonth[];
  mapSnapshotType?: string;
  steps: {
    location: ReportStepStatus;
    rainfall: ReportStepStatus;
    analysis: ReportStepStatus;
    forecast: ReportStepStatus;
  };
  lastError?: string;
};
