import { Schema, model, models, Model, Query, Types } from "mongoose";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";

/* ------------------------------------------------------------------
   Constants & types
------------------------------------------------------------------- */

/**
 * Which team section a member belongs to. Values match the `slug` used by
 * the static data in lib/data/all_data.ts, so the leadership page can swap
 * its `leadership` / `technicalAdvisors` arrays for `getPublic(group, locale)`.
 */
export const TEAM_GROUPS = ["leadership", "technical_advisors"] as const;
export type TeamGroup = (typeof TEAM_GROUPS)[number];

/** Single source of truth: the locales next-intl already routes on (en, hi). */
export const TEAM_LOCALES = routing.locales;
export type TeamLocale = AppLocale;

const NAME_MAX = 100;
const ROLE_MAX = 120;
const TAGLINE_MAX = 200;
// The longest English bio today is ~850 chars; Hindi runs longer, so leave room.
const DESCRIPTION_MAX = 3000;

/**
 * Cloudinary public_id as returned by upload (e.g.
 * "water-warriors/team/k3j2h1g"). Letters, digits, `_ - . /` only, no
 * leading/trailing slash. This also rejects full URLs, which keeps someone
 * from accidentally saving `secure_url` instead of `public_id`.
 */
const CLOUDINARY_PUBLIC_ID_REGEX = /^(?!\/)[A-Za-z0-9_\-./]+(?<!\/)$/;

/** Lowercase kebab-case, e.g. "rajesh-seshadri". */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Fields that differ per language. The person's name is NOT translated. */
export interface ITeamMemberTranslation {
  /** e.g. "Chief Technology Officer" */
  role: string;
  /** One-line summary shown under the name. */
  tagline: string;
  /** The longer bio. */
  description: string;
}

/** One entry per supported locale, e.g. `translations.hi.role`. */
export type TeamMemberTranslations = Record<TeamLocale, ITeamMemberTranslation>;

export interface ITeamMember {
  group: TeamGroup;
  /** Proper noun, stored once (the static data never translated it either). */
  fullName: string;
  /**
   * Stable URL-safe identifier (replaces the old `translationKey`). Auto-
   * generated from `fullName` when omitted. Unique among non-deleted members.
   */
  slug: string;
  /**
   * Cloudinary public_id ONLY - never a URL. The URL is derived on read
   * (see the `avatarUrl` virtual / `getPublic`) so changing cloud name,
   * CDN or transformations never requires a data migration.
   */
  avatarPublicId?: string | null;
  /** Display position inside the group (ascending). */
  order: number;
  /** Draft members are visible to admins only. */
  isPublished: boolean;
  /** Every supported locale is required - see the schema comment below. */
  translations: TeamMemberTranslations;

  /** Admin who created / last edited it. Ref assumes the admin model is "User". */
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMemberMethods {
  /** Translation for `locale`, falling back to the default locale. */
  getTranslation(locale: string): ITeamMemberTranslation;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

export interface ITeamMemberVirtuals {
  /** Full Cloudinary URL, or "" when there is no avatar. */
  avatarUrl: string;
}

/** Flattened, single-language shape the public team section renders. */
export interface PublicTeamMember {
  id: string;
  slug: string;
  group: TeamGroup;
  fullName: string;
  role: string;
  tagline: string;
  description: string;
  /** "" when no avatar - render an initials avatar instead. */
  avatarUrl: string;
}

export interface TeamMemberModel extends Model<
  ITeamMember,
  Record<string, never>,
  ITeamMemberMethods,
  ITeamMemberVirtuals
> {
  /** Published members of one group in one language, ordered, avatar URLs resolved. */
  getPublic(group: TeamGroup, locale: string): Promise<PublicTeamMember[]>;
  /** Persist a new order from an admin drag-and-drop: ids[0] becomes order 0, etc. */
  reorder(group: TeamGroup, orderedIds: string[]): Promise<void>;
}

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

/**
 * Translations are EMBEDDED (not a separate collection): a member is always
 * read together with its translations, the set is bounded by the number of
 * locales, and one document = one atomic write so a member can't exist
 * half-translated. Keyed by locale (not an array) so a locale is addressed
 * directly, can be projected in a query and can't be duplicated. The keys
 * come from `routing.locales`, so adding a locale to next-intl makes it
 * required here automatically.
 */
const translationSchema = new Schema<ITeamMemberTranslation>(
  {
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      minlength: [2, "Role must be at least 2 characters"],
      maxlength: [ROLE_MAX, `Role cannot exceed ${ROLE_MAX} characters`],
    },
    tagline: {
      type: String,
      required: [true, "Tagline is required"],
      trim: true,
      minlength: [3, "Tagline must be at least 3 characters"],
      maxlength: [
        TAGLINE_MAX,
        `Tagline cannot exceed ${TAGLINE_MAX} characters`,
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [
        DESCRIPTION_MAX,
        `Description cannot exceed ${DESCRIPTION_MAX} characters`,
      ],
    },
  },
  { _id: false },
);

const translationsSchema = new Schema(
  Object.fromEntries(
    TEAM_LOCALES.map((locale) => [
      locale,
      {
        type: translationSchema,
        required: [true, `${locale} translation is required`],
      },
    ]),
  ),
  { _id: false },
);

const teamMemberSchema = new Schema<
  ITeamMember,
  TeamMemberModel,
  ITeamMemberMethods,
  Record<string, never>,
  ITeamMemberVirtuals
>(
  {
    group: {
      type: String,
      required: [true, "Group is required"],
      enum: {
        values: TEAM_GROUPS,
        message: "{VALUE} is not a valid team group",
      },
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [NAME_MAX, `Full name cannot exceed ${NAME_MAX} characters`],
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      lowercase: true,
      maxlength: [120, "Slug cannot exceed 120 characters"],
      match: [
        SLUG_REGEX,
        "Slug must be lowercase letters, numbers and hyphens",
      ],
      // Generated from fullName by the pre-validate hook when omitted.
    },

    avatarPublicId: {
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
      // Filled by the pre-validate hook (appends to the end of the group).
    },

    // Default false so a half-finished profile never leaks to the public site.
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
 * Public team section: `{ group, isPublished:true, isDeleted:false }` sorted
 * by order. Equality fields first, sort field last -> served from the index.
 */
teamMemberSchema.index({ group: 1, isPublished: 1, isDeleted: 1, order: 1 });

/** Admin list: all members of a group in display order (drafts included). */
teamMemberSchema.index({ isDeleted: 1, group: 1, order: 1 });

/**
 * Slug must be unique, but only among live members: a plain unique index
 * would make a soft-deleted member block its slug forever. (Consequence:
 * `restore()` fails with a duplicate-key error if the slug has been reused.)
 */
teamMemberSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "slug_unique_active",
    partialFilterExpression: { isDeleted: false },
  },
);

/**
 * Admin search box across name and every language. MongoDB has no Hindi
 * stemmer, so `default_language: "none"` disables stemming/stop-words and
 * matches whole tokens for every language. One text index per collection.
 */
teamMemberSchema.index(
  {
    fullName: "text",
    ...Object.fromEntries(
      TEAM_LOCALES.flatMap((l) => [
        [`translations.${l}.role`, "text"],
        [`translations.${l}.tagline`, "text"],
        [`translations.${l}.description`, "text"],
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
teamMemberSchema.virtual("avatarUrl").get(function (this: ITeamMember) {
  return this.avatarPublicId ? getCloudinaryUrl(this.avatarPublicId) : "";
});

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/** "Rajesh Seshadri" -> "rajesh-seshadri". Latin names only (see assumptions). */
const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Fill in `slug` and `order` for new members when the caller didn't:
 * - slug: derived from fullName.
 * - order: appended to the end of the group (counting soft-deleted rows so
 *   a deleted member's slot is never reused).
 */
teamMemberSchema.pre("validate", async function () {
  if (!this.isNew) return;

  if (!this.slug && this.fullName) this.slug = slugify(this.fullName);

  if (this.order === undefined) {
    const last = await (this.constructor as TeamMemberModel)
      .findOne({ group: this.group })
      .setOptions({ includeDeleted: true })
      .sort({ order: -1 })
      .select("order")
      .lean();
    this.order = last ? last.order + 1 : 0;
  }
});

/**
 * Soft delete: hide deleted docs from find/count by default.
 * Opt out with `.setOptions({ includeDeleted: true })` (admin trash view).
 * aggregate() is NOT covered - add { $match: { isDeleted: false } } yourself.
 */
teamMemberSchema.pre(
  /^(find|count)/,
  function (this: Query<unknown, ITeamMember>) {
    if (this.getOptions().includeDeleted) return;
    this.where({ isDeleted: false });
  },
);

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

teamMemberSchema.methods.getTranslation = function (
  locale: string,
): ITeamMemberTranslation {
  const translations = this.translations as TeamMemberTranslations;
  return (
    translations[locale as TeamLocale] ?? translations[routing.defaultLocale]
  );
};

teamMemberSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isPublished = false;
  return this.save();
};

teamMemberSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

teamMemberSchema.statics.getPublic = async function (
  group: TeamGroup,
  locale: string,
): Promise<PublicTeamMember[]> {
  const lang: TeamLocale = (TEAM_LOCALES as readonly string[]).includes(locale)
    ? (locale as TeamLocale)
    : routing.defaultLocale;

  const docs = await this.find({ group, isPublished: true })
    .sort({ order: 1 })
    .select(`slug group fullName avatarPublicId translations.${lang}`) // ship only the active language
    .lean<
      {
        _id: Types.ObjectId;
        slug: string;
        group: TeamGroup;
        fullName: string;
        avatarPublicId?: string | null;
        translations: Record<string, ITeamMemberTranslation>;
      }[]
    >();

  return docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    group: d.group,
    fullName: d.fullName,
    role: d.translations[lang].role,
    tagline: d.translations[lang].tagline,
    description: d.translations[lang].description,
    avatarUrl: d.avatarPublicId ? getCloudinaryUrl(d.avatarPublicId) : "",
  }));
};

teamMemberSchema.statics.reorder = async function (
  group: TeamGroup,
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

const TeamMember =
  (models.TeamMember as unknown as TeamMemberModel | undefined) ||
  model<ITeamMember, TeamMemberModel>("TeamMember", teamMemberSchema);

export default TeamMember;
