import ImageKit from "@imagekit/nodejs";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env");
dotenv.config({ path: envPath });

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error("IMAGEKIT_PRIVATE_KEY is required to upload files to ImageKit.");
}

const imageKit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

const uploadOnImageKit = async (localFilePath, fileName = path.basename(localFilePath || "")) => {
  if (!localFilePath) return null;

  try {
    return await imageKit.files.upload({
      file: await fs.readFile(localFilePath),
      fileName,
      folder: "campux",
    });
  } finally {
    try {
      await fs.unlink(localFilePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
};

export { uploadOnImageKit };
