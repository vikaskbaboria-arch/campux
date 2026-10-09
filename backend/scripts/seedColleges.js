import "dotenv/config";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "../database/db.js";
import College from "../models/college.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.resolve(__dirname, "../data/raw-colleges.csv");
const BATCH_SIZE = 500;

const cleanCollegeName = (value = "") =>
  value.replace(/\s*\(Id:\s*C-\d+\)\s*$/i, "").replace(/\s+/g, " ").trim();

const makeShortName = (name = "") => {
  const stopWords = new Set(["of", "the", "and", "for", "a", "an"]);
  const words = name.replace(/[.,()]/g, " ").split(/\s+/).filter(Boolean)
    .filter((word) => !stopWords.has(word.toLowerCase()));
  return (words.map((word) => word[0]).join("").toUpperCase() || name.slice(0, 8)).slice(0, 20);
};

const toCollege = (row) => {
  const name = cleanCollegeName(row["College Name"]);
  const city = (row["District Name"] || "").trim();
  const state = (row["State Name"] || "").trim();
  if (!name || !city || !state) return null;

  return {
    name,
    shortName: makeShortName(name),
    location: { city, state, pincode: "" },
    logo: "",
    collegeSite: "",
    isVerified: false,
  };
};

async function writeBatch(batch) {
  if (!batch.length) return 0;

  const operations = batch.map((college) => ({
    updateOne: {
      filter: {
        name: college.name,
        "location.city": college.location.city,
        "location.state": college.location.state,
      },
      update: { $setOnInsert: college },
      upsert: true,
    },
  }));

  const result = await College.bulkWrite(operations, { ordered: false });
  return result.upsertedCount || 0;
}

async function run() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  await connectDB();

  const stream = fs.createReadStream(csvPath).pipe(csv());
  let batch = [];
  let readCount = 0;
  let skippedCount = 0;
  let insertedCount = 0;

  for await (const row of stream) {
    readCount += 1;
    const college = toCollege(row);

    if (!college) {
      skippedCount += 1;
      continue;
    }

    batch.push(college);

    if (batch.length >= BATCH_SIZE) {
      insertedCount += await writeBatch(batch);
      batch = [];
      console.log(`Read ${readCount} rows; inserted ${insertedCount} new colleges...`);
    }
  }

  insertedCount += await writeBatch(batch);

  console.log("Import completed:", { readCount, skippedCount, insertedCount });
  process.exit(0);
}

run().catch((error) => {
  console.error("College import failed:", error);
  process.exit(1);
});
