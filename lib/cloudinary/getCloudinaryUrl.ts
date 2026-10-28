export function getCloudinaryUrl(
  publicId: string,
  resourceType: "image" | "video" = "image",
) {
  if (!publicId) return "";

  const cloudName =
    typeof window === "undefined"
      ? process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) return "";

  const typeSegment = resourceType === "video" ? "video" : "image";

  return `https://res.cloudinary.com/${cloudName}/${typeSegment}/upload/${publicId}`;
}
