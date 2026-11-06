import { Schema, model, models, Model, Query, Types } from "mongoose";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";

/* ------------------------------------------------------------------
   Constants & types
------------------------------------------------------------------- */

/** Single source of truth: the locales next-intl already routes on (en, hi). */
export const DIY_GUIDE_LOCALES = routing.locales;
export type DiyGuideLocale = AppLocale;

/**
 * Where a media file (video or thumbnail) comes from. Exactly one is active
 * at a time:
 * - "upload":   a Cloudinary asset, stored as its public_id only.
 * - "external": a full URL (YouTube, Vimeo, any hosted file).
 */
export const MEDIA_SOURCES = ["upload", "external"] as const;
export type MediaSource = (typeof MEDIA_SOURCES)[number];

export type VideoProvider = "cloudinary" | "youtube" | "external";

const TITLE_MAX = 200;
const URL_MAX = 500;
/** 6 hours. Guards against someone entering milliseconds instead of seconds. */
const DURATION_MAX_SECONDS = 6 * 60 * 60;

/**
 * Cloudinary public_id as returned by upload (e.g.
 * "water-warriors/diy/videos/k3j2h1g"). Letters, digits, `_ - . /` only,
 * no leading/trailing slash. Also rejects full URLs, so nobody saves
 * `secure_url` by mistake.
 */
const CLOUDINARY_PUBLIC_ID_REGEX = /^(?!\/)[A-Za-z0-9_\-./]+(?<!\/)$/;

/** Lowercase kebab-case, e.g. "how-to-build-a-simple-system". */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const YOUTUBE_HOST_REGEX =
  /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;

/** One media reference. Only the field matching `source` is kept. */
export interface IMediaRef {
  source: MediaSource;
  /** Cloudinary public_id. Set only when `source === "upload"`. */
  publicId?: string | null;
  /** Full https URL. Set only when `source === "external"`. */
  externalUrl?: string | null;
}

/** Fields that differ per language. */
export interface IDiyGuideTranslation {
  title: string;
}

/** One entry per supported locale, e.g. `translations.hi.title`. */
export type DiyGuideTranslations = Record<DiyGuideLocale, IDiyGuideTranslation>;

export interface IDiyGuide {
  /** Stable URL-safe id, auto-generated from the English title. Unique among live guides. */
  slug: string;
  /** Exactly one source is active - see `MEDIA_SOURCES`. */
  video: IMediaRef;
  /**
   * Optional for YouTube videos (derived from the video id when omitted).
   * Required when the video is an upload or a non-YouTube URL, since
   * nothing can be derived for them.
   */
  thumbnail?: IMediaRef | null;
  /** Length in seconds (what Cloudinary reports). Shown in minutes by the UI. */
  durationSeconds?: number | null;
  /** Date shown on the card ("Oct 15"). Auto-set when first published. */
  publishedAt?: Date | null;
  /** Display position (ascending). Home page features order 0 and "up next" 1-3. */
  order: number;
  /** Draft guides are visible to admins only. */
  isPublished: boolean;
  /** Every supported locale is required - see the schema comment below. */
  translations: DiyGuideTranslations;

  /** Admin who created / last edited it. Ref assumes the admin model is "User". */
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IDiyGuideMethods {
  /** Translation for `locale`, falling back to the default locale. */
  getTranslation(locale: string): IDiyGuideTranslation;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

export interface IDiyGuideVirtuals {
  /** Playable URL: Cloudinary video URL or the external URL. */
  videoUrl: string;
  /** Tells the player whether to use <video>, a YouTube embed or a generic embed. */
  videoProvider: VideoProvider;
  /** Resolved thumbnail URL, or "" if none can be produced. */
  thumbnailUrl: string;
}

/** Flattened, single-language shape the public DIY sections render. */
export interface PublicDiyGuide {
  id: string;
  slug: string;
  title: string;
  videoSource: MediaSource;
  videoProvider: VideoProvider;
  videoUrl: string;
  /** "" when none can be produced - render a placeholder. */
  thumbnailUrl: string;
  /** Whole minutes (min 1), or null if unknown - hide the badge when null. */
  durationMinutes: number | null;
  /** ISO string (safe to pass server -> client component), or null. */
  publishedAt: string | null;
}

export interface DiyGuideModel extends Model<
  IDiyGuide,
  Record<string, never>,
  IDiyGuideMethods,
  IDiyGuideVirtuals
> {
  /** Published guides in one language, ordered, media URLs resolved. */
  getPublic(
    locale: string,
    opts?: { limit?: number },
  ): Promise<PublicDiyGuide[]>;
  /** Persist a new order from an admin drag-and-drop: ids[0] becomes order 0, etc. */
  reorder(orderedIds: string[]): Promise<void>;
}

/* ------------------------------------------------------------------
   URL resolution (shared by the virtuals and the lean-based `getPublic`)
------------------------------------------------------------------- */

const isYouTubeUrl = (url?: string | null): boolean => {
  if (!url) return false;
  try {
    return YOUTUBE_HOST_REGEX.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** Video id from watch?v=, youtu.be/, /embed/, /shorts/ and /live/ URLs. */
const getYouTubeId = (url: string): string | null => {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (hostname.includes("youtu.be")) return pathname.slice(1) || null;
    const [, kind, id] = pathname.split("/");
    if (kind && ["embed", "shorts", "live"].includes(kind)) return id || null;
    return searchParams.get("v");
  } catch {
    return null;
  }
};

const resolveVideo = (video?: IMediaRef | null) => {
  if (!video) return { url: "", provider: "external" as VideoProvider };
  if (video.source === "upload") {
    return {
      url: video.publicId ? getCloudinaryUrl(video.publicId, "video") : "",
      provider: "cloudinary" as VideoProvider,
    };
  }
  const url = video.externalUrl ?? "";
  return {
    url,
    provider: (isYouTubeUrl(url) ? "youtube" : "external") as VideoProvider,
  };
};

const resolveThumbnail = (
  thumbnail?: IMediaRef | null,
  video?: IMediaRef | null,
): string => {
  if (thumbnail?.source === "upload" && thumbnail.publicId) {
    return getCloudinaryUrl(thumbnail.publicId, "image");
  }
  if (thumbnail?.source === "external" && thumbnail.externalUrl) {
    return thumbnail.externalUrl;
  }
  // No thumbnail set: a YouTube video can supply its own.
  if (video?.source === "external" && isYouTubeUrl(video.externalUrl)) {
    const id = getYouTubeId(video.externalUrl!);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  return "";
};

/* ------------------------------------------------------------------
   Schema
------------------------------------------------------------------- */

/** Must be a parseable http(s) URL, so `javascript:` etc. can never be stored. */
const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Builds the sub-schema for a media reference. `publicIdLabel` only changes
 * error messages. The conditional `required` makes the active source's
 * value mandatory; the pre-validate hook below nulls the inactive one so a
 * stale value can't linger after an admin switches source.
 */
const buildMediaRefSchema = (label: string) =>
  new Schema<IMediaRef>(
    {
      source: {
        type: String,
        required: [true, `${label} source is required`],
        enum: {
          values: MEDIA_SOURCES,
          message: `{VALUE} is not a valid ${label.toLowerCase()} source`,
        },
      },
      publicId: {
        type: String,
        trim: true,
        maxlength: [255, "Cloudinary id cannot exceed 255 characters"],
        match: [
          CLOUDINARY_PUBLIC_ID_REGEX,
          "Store the Cloudinary public_id, not a URL",
        ],
        required: [
          function (this: IMediaRef) {
            return this.source === "upload";
          },
          `${label} Cloudinary id is required for uploads`,
        ],
        default: null,
      },
      externalUrl: {
        type: String,
        trim: true,
        maxlength: [URL_MAX, `URL cannot exceed ${URL_MAX} characters`],
        validate: {
          validator: (v: string | null | undefined) => !v || isHttpUrl(v),
          message: "URL must start with http:// or https://",
        },
        required: [
          function (this: IMediaRef) {
            return this.source === "external";
          },
          `${label} URL is required for external sources`,
        ],
        default: null,
      },
    },
    { _id: false },
  );

const videoSchema = buildMediaRefSchema("Video");
const thumbnailSchema = buildMediaRefSchema("Thumbnail");

/**
 * Translations are EMBEDDED (not a separate collection): a guide is always
 * read together with its translations, the set is bounded by the number of
 * locales, and one document = one atomic write so a guide can't exist
 * half-translated. Keyed by locale (not an array) so a locale is addressed
 * directly, can be projected in a query and can't be duplicated. The keys
 * come from `routing.locales`, so adding a locale to next-intl makes it
 * required here automatically.
 */
const translationSchema = new Schema<IDiyGuideTranslation>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [TITLE_MAX, `Title cannot exceed ${TITLE_MAX} characters`],
    },
  },
  { _id: false },
);

const translationsSchema = new Schema(
  Object.fromEntries(
    DIY_GUIDE_LOCALES.map((locale) => [
      locale,
      {
        type: translationSchema,
        required: [true, `${locale} translation is required`],
      },
    ]),
  ),
  { _id: false },
);

const diyGuideSchema = new Schema<
  IDiyGuide,
  DiyGuideModel,
  IDiyGuideMethods,
  Record<string, never>,
  IDiyGuideVirtuals
>(
  {
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
      // Generated from the English title by the pre-validate hook when omitted.
    },

    video: { type: videoSchema, required: [true, "Video is required"] },

    // Optional here; the pre-validate hook enforces the "required unless YouTube" rule.
    thumbnail: { type: thumbnailSchema, default: undefined },

    durationSeconds: {
      type: Number,
      min: [1, "Duration must be at least 1 second"],
      max: [DURATION_MAX_SECONDS, "Duration cannot exceed 6 hours"],
      validate: {
        validator: (v: number | null | undefined) =>
          v == null || Number.isInteger(v),
        message: "Duration must be a whole number of seconds",
      },
      default: null,
    },

    publishedAt: { type: Date, default: null },

    order: {
      type: Number,
      min: [0, "Order cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Order must be a whole number",
      },
      // Filled by the pre-validate hook (appends to the end of the list).
    },

    // Default false so a half-finished guide never leaks to the public site.
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
 * Public DIY sections: `{ isPublished:true, isDeleted:false }` sorted by
 * order. Equality fields first, sort field last -> served from the index.
 */
diyGuideSchema.index({ isPublished: 1, isDeleted: 1, order: 1 });

/** Admin list: every guide in display order (drafts included). */
diyGuideSchema.index({ isDeleted: 1, order: 1 });

/**
 * Slug must be unique, but only among live guides: a plain unique index
 * would let a soft-deleted guide block its slug forever. (Consequence:
 * `restore()` fails with a duplicate-key error if the slug has been reused.)
 */
diyGuideSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "slug_unique_active",
    partialFilterExpression: { isDeleted: false },
  },
);

/**
 * Admin search box across every language's title. MongoDB has no Hindi
 * stemmer, so `default_language: "none"` disables stemming/stop-words and
 * matches whole tokens for every language. One text index per collection.
 */
diyGuideSchema.index(
  Object.fromEntries(
    DIY_GUIDE_LOCALES.map((l) => [`translations.${l}.title`, "text"]),
  ),
  { name: "admin_text_idx", default_language: "none" },
);

/* ------------------------------------------------------------------
   Virtuals
------------------------------------------------------------------- */

/**
 * Only available on hydrated docs / toJSON, NOT on `.lean()` results -
 * `getPublic` resolves the URLs itself for that reason.
 */
diyGuideSchema.virtual("videoUrl").get(function (this: IDiyGuide) {
  return resolveVideo(this.video).url;
});

diyGuideSchema.virtual("videoProvider").get(function (this: IDiyGuide) {
  return resolveVideo(this.video).provider;
});

diyGuideSchema.virtual("thumbnailUrl").get(function (this: IDiyGuide) {
  return resolveThumbnail(this.thumbnail, this.video);
});

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */

/** "How to Build a Simple System" -> "how-to-build-a-simple-system". Latin titles only. */
const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");

diyGuideSchema.pre("validate", async function () {
  const Guide = this.constructor as DiyGuideModel;

  // 1. Only the active source keeps a value, so switching YouTube <-> upload
  //    never leaves a stale id/URL behind.
  for (const media of [this.video, this.thumbnail]) {
    if (!media) continue;
    if (media.source === "upload") media.externalUrl = null;
    if (media.source === "external") media.publicId = null;
  }

  // 2. Thumbnail is optional only when it can be derived (YouTube).
  const hasThumbnail = Boolean(
    this.thumbnail?.publicId || this.thumbnail?.externalUrl,
  );
  if (!hasThumbnail && !resolveThumbnail(null, this.video)) {
    this.invalidate(
      "thumbnail",
      "Thumbnail is required unless the video is a YouTube URL",
    );
  }

  // 3. Stamp the display date the first time a guide goes live.
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();

  if (!this.isNew) return;

  // 4. Slug from the English title, with -2, -3 ... on collision.
  if (!this.slug) {
    const base = slugify(
      this.translations?.[routing.defaultLocale]?.title ?? "",
    );
    if (base) {
      const taken = await Guide.find({
        slug: new RegExp(`^${base}(-\\d+)?$`),
      })
        .select("slug")
        .lean();
      const used = new Set(taken.map((g) => g.slug));
      let candidate = base;
      for (let n = 2; used.has(candidate); n++) candidate = `${base}-${n}`;
      this.slug = candidate;
    }
  }

  // 5. Append to the end of the list (counting soft-deleted rows so a
  //    deleted guide's slot is never reused).
  if (this.order === undefined) {
    const last = await Guide.findOne()
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
diyGuideSchema.pre(/^(find|count)/, function (this: Query<unknown, IDiyGuide>) {
  if (this.getOptions().includeDeleted) return;
  this.where({ isDeleted: false });
});

/* ------------------------------------------------------------------
   Methods & statics
------------------------------------------------------------------- */

diyGuideSchema.methods.getTranslation = function (
  locale: string,
): IDiyGuideTranslation {
  const translations = this.translations as DiyGuideTranslations;
  return (
    translations[locale as DiyGuideLocale] ??
    translations[routing.defaultLocale]
  );
};

diyGuideSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isPublished = false;
  return this.save();
};

diyGuideSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

diyGuideSchema.statics.getPublic = async function (
  locale: string,
  opts: { limit?: number } = {},
): Promise<PublicDiyGuide[]> {
  const lang: DiyGuideLocale = (
    DIY_GUIDE_LOCALES as readonly string[]
  ).includes(locale)
    ? (locale as DiyGuideLocale)
    : routing.defaultLocale;

  let query = this.find({ isPublished: true }).sort({ order: 1 }).select(
    `slug video thumbnail durationSeconds publishedAt translations.${lang}`, // ship only the active language
  );
  if (opts.limit) query = query.limit(opts.limit);

  const docs = await query.lean<
    {
      _id: Types.ObjectId;
      slug: string;
      video: IMediaRef;
      thumbnail?: IMediaRef | null;
      durationSeconds?: number | null;
      publishedAt?: Date | null;
      translations: Record<string, IDiyGuideTranslation>;
    }[]
  >();

  return docs.map((d) => {
    const video = resolveVideo(d.video);
    return {
      id: String(d._id),
      slug: d.slug,
      title: d.translations[lang].title,
      videoSource: d.video.source,
      videoProvider: video.provider,
      videoUrl: video.url,
      thumbnailUrl: resolveThumbnail(d.thumbnail, d.video),
      durationMinutes: d.durationSeconds
        ? Math.max(1, Math.round(d.durationSeconds / 60))
        : null,
      publishedAt: d.publishedAt ? d.publishedAt.toISOString() : null,
    };
  });
};

diyGuideSchema.statics.reorder = async function (
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

const DiyGuide =
  (models.DiyGuide as unknown as DiyGuideModel | undefined) ||
  model<IDiyGuide, DiyGuideModel>("DiyGuide", diyGuideSchema);

export default DiyGuide;
