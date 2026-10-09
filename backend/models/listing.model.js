import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true},
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    college:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"College",
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        enum:["Books","Electronics","Furniture","Accessories","Notes","Clothing","Other"],
        required:true
    },
    condition:{
        type:String,
        enum:["New","Like New","Used","Refurbished"],
        required:true
    },
    status:{
        type:String,
        enum:["Available","Sold","Reserved"],
        required:true,
    },
images: [
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
],

},{timestamps:true})

export default mongoose.models.Listing || mongoose.model("Listing", listingSchema);