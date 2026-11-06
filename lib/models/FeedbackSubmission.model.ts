import { Schema, model, models, Model, Query, Types } from "mongoose";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------- */

/** Mirrors `topicKeys` in the feedback form. */
export const FEEDBACK_TOPICS = [
  "property",
  "report",
  "general",
  "other",
] as const;
export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "spam",
  "archived",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface IFeedbackSubmission {
  // --- Submitted by the visitor (matches the feedback form) ---
  topic: FeedbackTopic;
  /** 1 (lowest) to 5 (highest), as chosen on the form. */
  rating: number;
  /** Optional - the form allows anonymous feedback. */
  name?: string;
  email?: string;
  message: string;

  // --- Request metadata (captured server-side in /api/feedback) ---
  /** SHA-256 hex of (ip + secret salt). Never store the raw IP. */
  ipHash?: string;
  userAgent?: string;

  // --- Admin workflow ---
  status: FeedbackStatus;
  reviewedAt?: Date | null;
  /** Admin who last handled it. Ref assumes your admin model is named "User". */
  handledBy?: Types.ObjectId | null;
  adminNote?: string;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedbackSubmissionMethods {
  setStatus(status: FeedbackStatus, adminId?: Types.ObjectId): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

export interface IFeedbackSubmissionVirtuals {
  preview: string;
  isAnonymous: boolean;
}

export interface FeedbackRatingStats {
  total: number;
  average: number;
  /** Count per star, keyed "1".."5". */
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface FeedbackSubmissionModel extends Model<
  IFeedbackSubmission,
  Record<string, never>,
  IFeedbackSubmissionMethods,
  IFeedbackSubmissionVirtuals
> {
  /** Rate-limit helper: submissions from one ip hash within the window. */
  countRecentByIp(ipHash: string, windowMs?: number): Promise<number>;
  /** Number of unreviewed submissions, for the admin sidebar badge. */
  countUnread(): Promise<number>;
  /** Average + distribution for the admin dashboard (excludes spam/deleted). */
  getRatingStats(topic?: FeedbackTopic): Promise<FeedbackRatingStats>;
}

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

/**
 * Browsers send "" for untouched optional inputs. Normalise that to
 * `undefined` so optional fields are truly absent and validators
 * (email format) never run against an empty string.
 */
const emptyToUndefined = (v?: string) => {
  const trimmed = typeof v === "string" ? v.trim() : v;
  return trimmed ? trimmed : undefined;
};

const feedbackSubmissionSchema = new Schema<
  IFeedbackSubmission,
  FeedbackSubmissionModel,
  IFeedbackSubmissionMethods,
  Record<string, never>,
  IFeedbackSubmissionVirtuals
>(
  {
    topic: {
      type: String,
      required: [true, "Topic is required"],
      enum: {
        values: FEEDBACK_TOPICS,
        message: "{VALUE} is not a valid topic",
      },
    },

    rating: {
      type: Number, // the form posts "1".."5" as strings; Mongoose casts them
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },

    name: {
      type: String,
      set: emptyToUndefined,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      set: (v?: string) => emptyToUndefined(v)?.toLowerCase(),
      maxlength: [254, "Email cannot exceed 254 characters"], // RFC 5321 limit
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters"],
      // Public, unauthenticated field: cap it to stop abuse / oversized docs.
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    ipHash: {
      type: String,
      match: [/^[a-f\d]{64}$/i, "ipHash must be a SHA-256 hex digest"],
      select: false, // not needed in admin list views
    },

    userAgent: { type: String, trim: true, maxlength: 512, select: false },

    status: {
      type: String,
      enum: {
        values: FEEDBACK_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "new",
    },

    reviewedAt: { type: Date, default: null },
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    adminNote: { type: String, trim: true, maxlength: 1000 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        delete ret.id;
        delete ret.ipHash;
        delete ret.userAgent;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

/* ------------------------------------------------------------------
   Indexes
------------------------------------------------------------------- */

/** Admin inbox: filter by status, newest first. */
feedbackSubmissionSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });

/** Admin filters by topic and/or rating (e.g. "low-rated property feedback"). */
feedbackSubmissionSchema.index({ topic: 1, rating: 1, createdAt: -1 });

/** Rate limiting in /api/feedback: count recent submissions per ip hash. */
feedbackSubmissionSchema.index({ ipHash: 1, createdAt: -1 }, { sparse: true });

/** Admin search box. One text index per collection, so cover all fields. */
feedbackSubmissionSchema.index(
  { name: "text", email: "text", message: "text" },
  { name: "admin_text_idx" },
);

/* ------------------------------------------------------------------
   Virtuals
------------------------------------------------------------------- */

/** Short snippet for list views so the admin table needn't ship full messages. */
feedbackSubmissionSchema.virtual("preview").get(function (
  this: IFeedbackSubmission,
) {
  return this.message.length > 120
    ? `${this.message.slice(0, 120).trimEnd()}…`
    : this.message;
});

/** True when the visitor left neither a name nor an email. */
feedbackSubmissionSchema.virtual("isAnonymous").get(function (
  this: IFeedbackSubmission,
) {
  return !this.name && !this.email;
});

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/** Stamp `reviewedAt` the first time a submission leaves "new" for a handled state. */
feedbackSubmissionSchema.pre("save", function () {
  if (!this.isModified("status")) return;
  if (
    (this.status === "reviewed" || this.status === "resolved") &&
    !this.reviewedAt
  ) {
    this.reviewedAt = new Date();
  }
});

/**
 * Soft delete: hide deleted docs from find/count by default.
 * Opt out with `.setOptions({ includeDeleted: true })` (admin trash view).
 * aggregate() is NOT covered - getRatingStats() adds its own $match.
 */
feedbackSubmissionSchema.pre(
  /^(find|count)/,
  function (this: Query<unknown, IFeedbackSubmission>) {
    if (this.getOptions().includeDeleted) return;
    this.where({ isDeleted: false });
  },
);

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

feedbackSubmissionSchema.methods.setStatus = function (
  status: FeedbackStatus,
  adminId?: Types.ObjectId,
) {
  this.status = status;
  if (adminId) this.handledBy = adminId;
  return this.save();
};

feedbackSubmissionSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

feedbackSubmissionSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

feedbackSubmissionSchema.statics.countRecentByIp = function (
  ipHash: string,
  windowMs = 60 * 60 * 1000,
) {
  return this.countDocuments({
    ipHash,
    createdAt: { $gte: new Date(Date.now() - windowMs) },
  });
};

feedbackSubmissionSchema.statics.countUnread = function () {
  return this.countDocuments({ status: "new" });
};

feedbackSubmissionSchema.statics.getRatingStats = async function (
  topic?: FeedbackTopic,
): Promise<FeedbackRatingStats> {
  const match: Record<string, unknown> = {
    isDeleted: false,
    status: { $nin: ["spam", "archived"] },
  };
  if (topic) match.topic = topic;

  const rows: { _id: number; count: number }[] = await this.aggregate([
    { $match: match },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let total = 0;
  let sum = 0;
  for (const { _id, count } of rows) {
    distribution[String(_id) as keyof typeof distribution] = count;
    total += count;
    sum += _id * count;
  }

  return {
    total,
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    distribution,
  };
};

/* ------------------------------------------------------------------
   Model (guard against Next.js hot-reload recompilation)
------------------------------------------------------------------- */

const FeedbackSubmission =
  (models.FeedbackSubmission as unknown as
    | FeedbackSubmissionModel
    | undefined) ||
  model<IFeedbackSubmission, FeedbackSubmissionModel>(
    "FeedbackSubmission",
    feedbackSubmissionSchema,
  );

export default FeedbackSubmission;
