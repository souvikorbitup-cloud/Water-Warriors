import "server-only";

import { Model, Schema, model, models } from "mongoose";
import type { RooftopSelection } from "@/lib/report/types";

export interface IBillingOrder {
  orderId: string;
  amountPaise: number;
  currency: string;
  couponCode: string | null;
  customerName: string;
  rooftopSelection?: RooftopSelection;
  status: "created" | "paid";
  paymentId?: string;
  createdAt: Date;
  paidAt?: Date;
}

const reportPointSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const rooftopSelectionSchema = new Schema(
  {
    name: { type: String, default: "" },
    points: { type: [reportPointSchema], required: true },
    zoom: { type: Number, required: true },
  },
  { _id: false },
);

const billingOrderSchema = new Schema<IBillingOrder>(
  {
    orderId: { type: String, required: true, trim: true },
    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },
    couponCode: { type: String, default: null },
    customerName: { type: String, default: "" },
    rooftopSelection: { type: rooftopSelectionSchema },
    status: { type: String, enum: ["created", "paid"], required: true },
    paymentId: { type: String },
    createdAt: { type: Date, required: true },
    paidAt: { type: Date },
  },
  { collection: "billingOrders", versionKey: false },
);

billingOrderSchema.index(
  { orderId: 1 },
  { unique: true, name: "billing_order_id_unique" },
);

const BillingOrder =
  (models.BillingOrder as Model<IBillingOrder> | undefined) ??
  model<IBillingOrder>("BillingOrder", billingOrderSchema);

export default BillingOrder;
