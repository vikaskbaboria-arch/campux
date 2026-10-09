import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const uploadImage = async (files) => {
  if (!files || files.length === 0) {
    throw new ApiError(400, "Please select at least one image");
  }

  const uploadedImages = await Promise.all(
    files.map(async (file) => {
      const result = await uploadOnCloudinary(file.path);

      if (!result) {
        throw new ApiError(500, "Failed to upload image");
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    })
  );

  return uploadedImages;
};