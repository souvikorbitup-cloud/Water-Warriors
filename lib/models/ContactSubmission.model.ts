import { Schema, model, models, Model, Query, Types } from "mongoose";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------- */

export const CONTACT_STATUSES = [
  "new",
  "read",
  "replied",
  "spam",
  "archived",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContactSubmission {
  // --- Submitted by the visitor (matches the form's name / email / message) ---
  name: string;
  email: string;
  message: string;

  // --- Request metadata (captured server-side in /api/contact) ---
  /** SHA-256 hex of (ip + secret salt). Never store the raw IP. */
  ipHash?: string;
  userAgent?: string;

  // --- Admin workflow ---
  status: ContactStatus;
  readAt?: Date | null;
  repliedAt?: Date | null;
  /** Admin who last handled it. Ref assumes your admin model is named "User". */
  handledBy?: Types.ObjectId | null;
  /** Short internal note. Use a separate collection for full threads. */
  adminNote?: string;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IContactSubmissionMethods {
  setStatus(status: ContactStatus, adminId?: Types.ObjectId): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

export interface IContactSubmissionVirtuals {
  preview: string;
}

export interface ContactSubmissionModel extends Model<
  IContactSubmission,
  Record<string, never>,
  IContactSubmissionMethods,
  IContactSubmissionVirtuals
> {
  /** Rate-limit helper: submissions from one ip hash within the window. */
  countRecentByIp(ipHash: string, windowMs?: number): Promise<number>;
  /** Number of unhandled submissions, for the admin sidebar badge. */
  countUnread(): Promise<number>;
}

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

const contactSubmissionSchema = new Schema<
  IContactSubmission,
  ContactSubmissionModel,
  IContactSubmissionMethods,
  Record<string, never>,
  IContactSubmissionVirtuals
>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true, // normalise so per-sender lookups and indexes match
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
        values: CONTACT_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "new",
    },

    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },

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
contactSubmissionSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });

/** "All messages from this sender" and duplicate detection. */
contactSubmissionSchema.index({ email: 1, createdAt: -1 });

/** Rate limiting in /api/contact: count recent submissions per ip hash. */
contactSubmissionSchema.index({ ipHash: 1, createdAt: -1 }, { sparse: true });

/** Admin search box. */
contactSubmissionSchema.index(
  { name: "text", email: "text", message: "text" },
  { name: "admin_text_idx" },
);

/* ------------------------------------------------------------------
   Virtuals
------------------------------------------------------------------- */

/** Short snippet for list views so the admin table needn't ship full messages. */
contactSubmissionSchema.virtual("preview").get(function (
  this: IContactSubmission,
) {
  return this.message.length > 120
    ? `${this.message.slice(0, 120).trimEnd()}…`
    : this.message;
});

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/**
 * Keep status and timestamps consistent no matter who changes the status
 * (admin UI, script, shell) instead of trusting every caller.
 */
contactSubmissionSchema.pre("save", function () {
  if (!this.isModified("status")) return;
  const now = new Date();
  if (this.status === "read" && !this.readAt) this.readAt = now;
  if (this.status === "replied") {
    if (!this.readAt) this.readAt = now;
    if (!this.repliedAt) this.repliedAt = now;
  }
});

/**
 * Soft delete: hide deleted docs from find/count by default.
 * Opt out with `.setOptions({ includeDeleted: true })` (admin trash view).
 * aggregate() is NOT covered - add { $match: { isDeleted: false } } yourself.
 */
contactSubmissionSchema.pre(
  /^(find|count)/,
  function (this: Query<unknown, IContactSubmission>) {
    if (this.getOptions().includeDeleted) return;
    this.where({ isDeleted: false });
  },
);

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

contactSubmissionSchema.methods.setStatus = function (
  status: ContactStatus,
  adminId?: Types.ObjectId,
) {
  this.status = status;
  if (adminId) this.handledBy = adminId;
  return this.save();
};

contactSubmissionSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

contactSubmissionSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

contactSubmissionSchema.statics.countRecentByIp = function (
  ipHash: string,
  windowMs = 60 * 60 * 1000,
) {
  return this.countDocuments({
    ipHash,
    createdAt: { $gte: new Date(Date.now() - windowMs) },
  });
};

contactSubmissionSchema.statics.countUnread = function () {
  return this.countDocuments({ status: "new" });
};

/* ------------------------------------------------------------------
   Model (guard against Next.js hot-reload recompilation)
------------------------------------------------------------------- */

const ContactSubmission =
  (models.ContactSubmission as unknown as ContactSubmissionModel | undefined) ||
  model<IContactSubmission, ContactSubmissionModel>(
    "ContactSubmission",
    contactSubmissionSchema,
  );

export default ContactSubmission;
