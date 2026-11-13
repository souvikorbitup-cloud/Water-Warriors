import "server-only";

import { Model, Schema, model, models } from "mongoose";

interface IReportAnalysisCache {
  cacheKey: string;
  analysis: string[];
  expiresAt: Date;
}

const reportAnalysisCacheSchema = new Schema<IReportAnalysisCache>(
  {
    cacheKey: { type: String, required: true },
    analysis: { type: [String], required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: "reportAnalysisCache" },
);

reportAnalysisCacheSchema.index(
  { cacheKey: 1 },
  { unique: true, name: "report_analysis_cache_key_unique" },
);
reportAnalysisCacheSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "report_analysis_cache_expiry" },
);

const ReportAnalysisCache =
  (models.ReportAnalysisCache as Model<IReportAnalysisCache> | undefined) ??
  model<IReportAnalysisCache>("ReportAnalysisCache", reportAnalysisCacheSchema);

export default ReportAnalysisCache;
