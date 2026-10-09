import mongoose from "mongoose";
import College from "../models/college.model.js";
import colleges from "./college.data.js";
import dotenv from 'dotenv'



dotenv.config({
    path:'./.env'
});
await mongoose.connect(process.env.MONGODB_URI);

await College.deleteMany({});

await College.insertMany(colleges);

console.log("20 colleges added successfully");

await mongoose.disconnect();