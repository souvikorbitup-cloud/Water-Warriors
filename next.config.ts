import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,
  partialPrefetching: true,

  images: {
    remotePatterns: cloudinaryCloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudinaryCloudName}/**`,
          },
        ]
      : [],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
