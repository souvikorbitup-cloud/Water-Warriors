import cloudinary from "./cloudinary";

export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  file_type: "image" | "video" | "raw" | "auto",
) {
  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: file_type,
      },
      (error, result) => {
        if (error || !result) {
          reject(error);
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(file);
  });
}
