import mongoose from 'mongoose';

import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
        name:{
        type:String,
        required:true
    },
    college:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"College",
  
    },
    profilePic:{
        type:String,

    },
    email:{
        type:String,
        required:true
    },
    year:{
        type:Number,
        enum:[1,2,3,4],
    },
    branch:{
        type:String,
        enum:["CSE","ECE","MECH","CIVIL","EEE","IT","CHEMICAL","BIOTECH","AEROSPACE","METALLURGY"],
    },
    refreshToken:{
        type:String
    },
    password:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
        _id:this._id,
        email:this.email,
        name:this.name,
        college:this.college},
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}

userSchema.methods.generateRefreshToken =function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export default mongoose.models.User || mongoose.model("User", userSchema);