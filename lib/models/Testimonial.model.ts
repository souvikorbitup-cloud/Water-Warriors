import { Schema, model, models, Model, Query, Types } from "mongoose";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import type { PublicTestimonial } from "@/lib/content/constants";

/* ------------------------------------------------------------------
   Constants & types
------------------------------------------------------------------- */

/** Single source of truth: the locales next-intl already routes on (en, hi). */
export const TESTIMONIAL_LOCALES = routing.locales;
export type TestimonialLocale = AppLocale;

const NAME_MAX = 100;
const JOB_ROLE_MAX = 100;
const MESSAGE_MAX = 1000;

/**
 * Cloudinary public_id as returned by upload (e.g.
 * "water-warriors/testimonials/k3j2h1g"). Letters, digits, `_ - . /` only,
 * no leading/trailing slash. This also rejects full URLs, which keeps
 * someone from accidentally saving `secure_url` instead of `public_id`.
 */
const CLOUDINARY_PUBLIC_ID_REGEX = /^(?!\/)[A-Za-z0-9_\-./]+(?<!\/)$/;

/** Fields that differ per language. The person's name is NOT translated. */
export interface ITestimonialTranslation {
  /** e.g. "Education Creator" / "शिक्षा निर्माता" */
  jobRole: string;
  /** The testimonial text itself. */
  message: string;
}

/** One entry per supported locale, e.g. `translations.hi.message`. */
export type TestimonialTranslations = Record<
  TestimonialLocale,
  ITestimonialTranslation
>;

export interface ITestimonial {
  /** Proper noun, stored once (the static data never translated it either). */
  fullName: string;
  /**
   * Cloudinary public_id ONLY - never a URL. The URL is derived on read
   * (see the `imageUrl` virtual / `getPublic`) so changing cloud name,
   * CDN or transformations never requires a data migration.
   */
  imagePublicId?: string | null;
  /** Display position in the slider (ascending). */
  order: number;
  /** Draft testimonials are visible to admins only. */
  isPublished: boolean;
  /** Every supported locale is required - see the schema comment below. */
  translations: TestimonialTranslations;

  /** Admin who created / last edited it. Ref assumes the admin model is "User". */
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ITestimonialMethods {
  /** Translation for `locale`, falling back to the default locale. */
  getTranslation(locale: string): ITestimonialTranslation;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

export interface ITestimonialVirtuals {
  /** Full Cloudinary URL, or "" when there is no image. */
  imageUrl: string;
}

export type { PublicTestimonial };

export interface TestimonialModel extends Model<
  ITestimonial,
  Record<string, never>,
  ITestimonialMethods,
  ITestimonialVirtuals
> {
  /** Published testimonials in one language, ordered, with image URLs resolved. */
  getPublic(locale: string): Promise<PublicTestimonial[]>;
  /** Persist a new order from an admin drag-and-drop: ids[0] becomes order 0, etc. */
  reorder(orderedIds: string[]): Promise<void>;
}

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

/**
 * Translations are EMBEDDED (not a separate collection): a testimonial is
 * always read together with its translations, the set is bounded by the
 * number of locales, and one document = one atomic write so a testimonial
 * can't exist half-translated. Keyed by locale (not an array) so a locale
 * is addressed directly, can be projected in a query and can't be
 * duplicated. The keys come from `routing.locales`, so adding a locale to
 * next-intl makes it required here automatically.
 */
const translationSchema = new Schema<ITestimonialTranslation>(
  {
    jobRole: {
      type: String,
      required: [true, "Job role is required"],
      trim: true,
      minlength: [2, "Job role must be at least 2 characters"],
      maxlength: [
        JOB_ROLE_MAX,
        `Job role cannot exceed ${JOB_ROLE_MAX} characters`,
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [
        MESSAGE_MAX,
        `Message cannot exceed ${MESSAGE_MAX} characters`,
      ],
    },
  },
  { _id: false },
);

const translationsSchema = new Schema(
  Object.fromEntries(
    TESTIMONIAL_LOCALES.map((locale) => [
      locale,
      {
        type: translationSchema,
        required: [true, `${locale} translation is required`],
      },
    ]),
  ),
  { _id: false },
);

const testimonialSchema = new Schema<
  ITestimonial,
  TestimonialModel,
  ITestimonialMethods,
  Record<string, never>,
  ITestimonialVirtuals
>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [NAME_MAX, `Full name cannot exceed ${NAME_MAX} characters`],
    },

    imagePublicId: {
      type: String,
      trim: true,
      maxlength: [255, "Image id cannot exceed 255 characters"],
      match: [
        CLOUDINARY_PUBLIC_ID_REGEX,
        "Store the Cloudinary public_id, not a URL",
      ],
      default: null,
    },

    order: {
      type: Number,
      min: [0, "Order cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Order must be a whole number",
      },
      // Filled by the pre-validate hook (appends to the end of the list).
    },

    // Default false so a half-finished testimonial never leaks to the public site.
    isPublished: { type: Boolean, default: false },

    translations: { type: translationsSchema, required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

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
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

/* ------------------------------------------------------------------
   Indexes
------------------------------------------------------------------- */

/**
 * Public slider: `{ isPublished:true, isDeleted:false }` sorted by order.
 * Equality fields first, sort field last -> served fully from the index.
 */
testimonialSchema.index({ isPublished: 1, isDeleted: 1, order: 1 });

/** Admin list: every testimonial in display order (drafts included). */
testimonialSchema.index({ isDeleted: 1, order: 1 });

/**
 * Admin search box across name and every language. MongoDB has no Hindi
 * stemmer, so `default_language: "none"` disables stemming/stop-words and
 * matches whole tokens for every language. One text index per collection.
 */
testimonialSchema.index(
  {
    fullName: "text",
    ...Object.fromEntries(
      TESTIMONIAL_LOCALES.flatMap((l) => [
        [`translations.${l}.jobRole`, "text"],
        [`translations.${l}.message`, "text"],
      ]),
    ),
  },
  { name: "admin_text_idx", default_language: "none" },
);

/* ------------------------------------------------------------------
   Virtuals
------------------------------------------------------------------- */

/**
 * Only available on hydrated docs / toJSON, NOT on `.lean()` results -
 * `getPublic` resolves the URL itself for that reason.
 */
testimonialSchema.virtual("imageUrl").get(function (this: ITestimonial) {
  return this.imagePublicId ? getCloudinaryUrl(this.imagePublicId) : "";
});

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/** New testimonials go to the end of the list unless an explicit order is given. */
testimonialSchema.pre("validate", async function () {
  if (!this.isNew || this.order !== undefined) return;
  const last = await (this.constructor as TestimonialModel)
    .findOne()
    .setOptions({ includeDeleted: true }) // never reuse a soft-deleted slot
    .sort({ order: -1 })
    .select("order")
    .lean();
  this.order = last ? last.order + 1 : 0;
});

/**
 * Soft delete: hide deleted docs from find/count by default.
 * Opt out with `.setOptions({ includeDeleted: true })` (admin trash view).
 * aggregate() is NOT covered - add { $match: { isDeleted: false } } yourself.
 */
testimonialSchema.pre(
  /^(find|count)/,
  function (this: Query<unknown, ITestimonial>) {
    if (this.getOptions().includeDeleted) return;
    this.where({ isDeleted: false });
  },
);

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

testimonialSchema.methods.getTranslation = function (
  locale: string,
): ITestimonialTranslation {
  const translations = this.translations as TestimonialTranslations;
  return (
    translations[locale as TestimonialLocale] ??
    translations[routing.defaultLocale]
  );
};

testimonialSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isPublished = false;
  return this.save();
};

testimonialSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

testimonialSchema.statics.getPublic = async function (
  locale: string,
): Promise<PublicTestimonial[]> {
  const lang: TestimonialLocale = (
    TESTIMONIAL_LOCALES as readonly string[]
  ).includes(locale)
    ? (locale as TestimonialLocale)
    : routing.defaultLocale;

  const docs = await this.find({ isPublished: true })
    .sort({ order: 1 })
    .select(`fullName imagePublicId translations.${lang}`) // ship only the active language
    .lean<
      {
        _id: Types.ObjectId;
        fullName: string;
        imagePublicId?: string | null;
        translations: Record<string, ITestimonialTranslation>;
      }[]
    >();

  return docs.map((d) => ({
    id: String(d._id),
    fullName: d.fullName,
    jobRole: d.translations[lang].jobRole,
    message: d.translations[lang].message,
    imageUrl: d.imagePublicId ? getCloudinaryUrl(d.imagePublicId) : "",
  }));
};

testimonialSchema.statics.reorder = async function (
  orderedIds: string[],
): Promise<void> {
  if (!orderedIds.length) return;
  await this.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    })),
  );
};

/* ------------------------------------------------------------------
   Model (guard against Next.js hot-reload recompilation)
------------------------------------------------------------------- */

const Testimonial =
  (models.Testimonial as unknown as TestimonialModel | undefined) ||
  model<ITestimonial, TestimonialModel>("Testimonial", testimonialSchema);

export default Testimonial;
