import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    shortName:{
      type:String, 
    
      trim:true
    },
    location:{
      city:{
        type:String,
        required:true,
        trim:true
      },
      state:{
        type:String,
        required:true,
        trim:true
      },
      pincode:{
        type:String,
       
        trim:true
      },
     
    },
    logo:{
        type:String,
        
    },
    collegeSite:{
      type:String,
      trim:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
 
   requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
},
{timestamps:true}
)


collegeSchema.index(
  {
    name: 1,
    "location.city": 1,
    "location.state": 1
  },
  {
    unique: true
  }
);
export default mongoose.models.College ||
    mongoose.model("College", collegeSchema);