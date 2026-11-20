import "server-only";

import { Model, Schema, model, models } from "mongoose";
import type {
  ReportForecastMonth,
  ReportLocation,
  ReportLocale,
  ReportPoint,
  ReportSessionData,
  RooftopSelection,
} from "@/lib/report/types";

export interface IReportSession extends Omit<
  ReportSessionData,
  | "steps"
  | "customerName"
  | "selection"
  | "areaSqm"
  | "centroid"
  | "runoffCoefficient"
  | "location"
  | "forecast"
> {
  paymentId?: string;
  analyticsConsent: boolean;
  customerName?: string;
  selection?: RooftopSelection;
  areaSqm?: number;
  centroid?: ReportPoint;
  runoffCoefficient?: number;
  location?: ReportLocation;
  analysisLocale?: ReportLocale;
  forecast?: ReportForecastMonth[];
  steps: ReportSessionData["steps"];
  generationStartedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema<ReportPoint>(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

const selectionSchema = new Schema<RooftopSelection>(
  {
    name: { type: String, default: "", maxlength: 100 },
    points: { type: [pointSchema], required: true },
    zoom: { type: Number, required: true, min: 0, max: 22 },
  },
  { _id: false },
);

const locationSchema = new Schema<ReportLocation>(
  {
    locality: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    countryCode: { type: String, required: true },
  },
  { _id: false },
);

const forecastMonthSchema = new Schema<ReportForecastMonth>(
  {
    month: { type: String, required: true },
    monthStart: { type: String, required: true },
    rainfallMm: { type: Number, required: true, min: 0 },
    harvestableLitres: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const reportSessionSchema = new Schema<IReportSession>(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String },
    analyticsConsent: { type: Boolean, default: false, required: true },
    status: {
      type: String,
      enum: ["pending", "generating", "retrying", "ready", "failed"],
      default: "pending",
      required: true,
    },
    customerName: { type: String, maxlength: 100 },
    selection: { type: selectionSchema },
    areaSqm: { type: Number, min: 0 },
    centroid: { type: pointSchema },
    runoffCoefficient: { type: Number },
    annualRainfallMm: { type: Number, min: 0 },
    potentialLitres: { type: Number, min: 0 },
    location: { type: locationSchema },
    analysis: { type: [String], default: undefined },
    analysisLocale: { type: String, enum: ["en", "hi"] },
    waterValueRupeesPerKilolitre: { type: Number, min: 0 },
    waterValueIsLocationBased: { type: Boolean },
    forecast: { type: [forecastMonthSchema], default: undefined },
    mapSnapshotType: { type: String },
    steps: {
      location: {
        type: String,
        enum: ["pending", "complete", "failed"],
        default: "pending",
        required: true,
      },
      rainfall: {
        type: String,
        enum: ["pending", "complete", "failed"],
        default: "pending",
        required: true,
      },
      analysis: {
        type: String,
        enum: ["pending", "complete", "failed"],
        default: "pending",
        required: true,
      },
      forecast: {
        type: String,
        enum: ["pending", "complete", "failed"],
        default: "pending",
        required: true,
      },
    },
    generationStartedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true, collection: "reportSessions" },
);

reportSessionSchema.index(
  { orderId: 1 },
  { unique: true, name: "report_session_order_unique" },
);

const ReportSession =
  (models.ReportSession as Model<IReportSession> | undefined) ??
  model<IReportSession>("ReportSession", reportSessionSchema);

export default ReportSession;
