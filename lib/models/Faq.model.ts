import { Schema, model, models, Model, Query, Types } from "mongoose";
import { routing, type AppLocale } from "@/i18n/routing";

/* ------------------------------------------------------------------
   Constants & types
------------------------------------------------------------------- */

/**
 * Where an FAQ is shown. Today only the Contact page renders FAQs
 * (messages/*.json -> Contact.faqs). Add a value here when another page
 * gets its own FAQ list; nothing else in the schema has to change.
 */
export const FAQ_GROUPS = ["contact", "general"] as const;
export type FaqGroup = (typeof FAQ_GROUPS)[number];

/** Single source of truth: the locales next-intl already routes on (en, hi). */
export const FAQ_LOCALES = routing.locales;
export type FaqLocale = AppLocale;

const QUESTION_MAX = 300;
const ANSWER_MAX = 2000;

export interface IFaqTranslation {
  question: string;
  answer: string;
}

/** One entry per supported locale, e.g. `translations.hi.question`. */
export type FaqTranslations = Record<FaqLocale, IFaqTranslation>;

export interface IFaq {
  group: FaqGroup;
  /** Display position inside the group (ascending). */
  order: number;
  /** Draft FAQs are visible to admins only. */
  isPublished: boolean;
  /** Every supported locale is required - see the schema comment below. */
  translations: FaqTranslations;

  /** Admin who created / last edited it. Ref assumes the admin model is "User". */
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IFaqMethods {
  /** Translation for `locale`, falling back to the default locale. */
  getTranslation(locale: string): IFaqTranslation;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

/** Flattened, single-language shape the public FAQ section renders. */
export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
}

export interface FaqModel extends Model<
  IFaq,
  Record<string, never>,
  IFaqMethods
> {
  /** Published FAQs for one page + language, ordered, with only that language projected. */
  getPublic(group: FaqGroup, locale: string): Promise<PublicFaq[]>;
  /** Persist a new order from an admin drag-and-drop: ids[0] becomes order 0, etc. */
  reorder(group: FaqGroup, orderedIds: string[]): Promise<void>;
}

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

/**
 * Translations are EMBEDDED in the FAQ document (not a separate collection):
 * - an FAQ is always read together with its translations,
 * - the set is small and bounded (one entry per locale, capped by routing.locales),
 * - one document = one atomic write, so an FAQ can never exist half-translated.
 *
 * Stored as an object keyed by locale instead of an array so that a locale
 * is addressed directly (`translations.hi.question`), can be projected in
 * a query (we ship only the active language to the client) and can't be
 * duplicated. The shape is generated from `routing.locales`, so adding a
 * locale to next-intl automatically makes it required here.
 */
const translationSchema = new Schema<IFaqTranslation>(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [3, "Question must be at least 3 characters"],
      maxlength: [
        QUESTION_MAX,
        `Question cannot exceed ${QUESTION_MAX} characters`,
      ],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      minlength: [3, "Answer must be at least 3 characters"],
      maxlength: [ANSWER_MAX, `Answer cannot exceed ${ANSWER_MAX} characters`],
    },
  },
  { _id: false },
);

const translationsSchema = new Schema(
  Object.fromEntries(
    FAQ_LOCALES.map((locale) => [
      locale,
      {
        type: translationSchema,
        required: [true, `${locale} translation is required`],
      },
    ]),
  ),
  { _id: false },
);

const faqSchema = new Schema<IFaq, FaqModel, IFaqMethods>(
  {
    group: {
      type: String,
      enum: { values: FAQ_GROUPS, message: "{VALUE} is not a valid FAQ group" },
      default: "contact",
      required: true,
    },

    order: {
      type: Number,
      min: [0, "Order cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Order must be a whole number",
      },
      // Filled by the pre-validate hook (appends to the end of the group).
    },

    // Default false so a half-finished FAQ never leaks to the public site.
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
 * Public FAQ section: `{ group, isPublished, isDeleted:false }` sorted by order.
 * Equality fields first, sort field last -> served fully from the index.
 */
faqSchema.index({ group: 1, isPublished: 1, isDeleted: 1, order: 1 });

/** Admin list: all FAQs of a group in display order (drafts included). */
faqSchema.index({ isDeleted: 1, group: 1, order: 1 });

/**
 * Admin search box across every language. MongoDB has no Hindi stemmer, so
 * `default_language: "none"` disables stemming/stop-words and matches whole
 * tokens for every language instead of mangling Devanagari text.
 * One text index per collection, hence all fields listed here.
 */
faqSchema.index(
  Object.fromEntries(
    FAQ_LOCALES.flatMap((l) => [
      [`translations.${l}.question`, "text"],
      [`translations.${l}.answer`, "text"],
    ]),
  ),
  { name: "admin_text_idx", default_language: "none" },
);

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/** New FAQs go to the end of their group unless an explicit order is given. */
faqSchema.pre("validate", async function () {
  if (!this.isNew || this.order !== undefined) return;
  const last = await (this.constructor as FaqModel)
    .findOne({ group: this.group })
    .setOptions({ includeDeleted: true }) // never reuse a soft-deleted FAQ's slot
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
faqSchema.pre(/^(find|count)/, function (this: Query<unknown, IFaq>) {
  if (this.getOptions().includeDeleted) return;
  this.where({ isDeleted: false });
});

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

faqSchema.methods.getTranslation = function (locale: string): IFaqTranslation {
  const translations = this.translations as FaqTranslations;
  return (
    translations[locale as FaqLocale] ?? translations[routing.defaultLocale]
  );
};

faqSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isPublished = false;
  return this.save();
};

faqSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

faqSchema.statics.getPublic = async function (
  group: FaqGroup,
  locale: string,
): Promise<PublicFaq[]> {
  const lang: FaqLocale = (FAQ_LOCALES as readonly string[]).includes(locale)
    ? (locale as FaqLocale)
    : routing.defaultLocale;

  const docs = await this.find({ group, isPublished: true })
    .sort({ order: 1 })
    .select(`translations.${lang}`) // ship only the active language
    .lean<
      { _id: Types.ObjectId; translations: Record<string, IFaqTranslation> }[]
    >();

  return docs.map((d) => ({
    id: String(d._id),
    question: d.translations[lang].question,
    answer: d.translations[lang].answer,
  }));
};

faqSchema.statics.reorder = async function (
  group: FaqGroup,
  orderedIds: string[],
): Promise<void> {
  if (!orderedIds.length) return;
  await this.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, group },
        update: { $set: { order: index } },
      },
    })),
  );
};

/* ------------------------------------------------------------------
   Model (guard against Next.js hot-reload recompilation)
------------------------------------------------------------------- */

const Faq =
  (models.Faq as unknown as FaqModel | undefined) ||
  model<IFaq, FaqModel>("Faq", faqSchema);

export default Faq;
