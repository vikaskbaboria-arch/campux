import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    listing:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Listing",
        required:true
    },
    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    counterOfferPrice:{
        type:Number,
    },
    counterOfferBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    acceptedPrice:{
        type:Number,
    },
    status:{
       type:String,
       enum:["Pending","Countered","Accepted","Rejected"],
       required:true
    }
},{timestamps:true})

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
