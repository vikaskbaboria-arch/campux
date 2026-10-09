import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    text:{
        type:String,
        required:true
    },
    readBy:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"User",
        default:[]
    }
},{
    timestamps:true
})

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
