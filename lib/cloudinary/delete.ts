import cloudinary from "./cloudinary";

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
