import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app =express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true, limit :"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())




import useRouter from './routes/user.route.js'
import healthcheckRouter from "./routes/healthcheck.route.js"
import collegeRouter from "./routes/college.route.js"
import listingRouter from "./routes/lisiting.route.js"
import offerRouter from "./routes/offer.route.js"
import conversationRouter from "./routes/conversation.route.js"
import messageRouter from "./routes/message.route.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use('/api/v1/users',useRouter)

app.use('/api/v1/colleges',collegeRouter)

app.use('/api/v1/listing',listingRouter)
app.use('/api/v1/offer',offerRouter)
app.use('/api/v1/conversations',conversationRouter)
app.use('/api/v1/messages',messageRouter)








export {app}
