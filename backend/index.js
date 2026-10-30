import "dotenv/config";
import { createServer } from "node:http";
import connectDB from './database/db.js';
import { initializeSocketServer } from "./services/socket.service.js";


import {app} from './app.js';

const httpServer = createServer(app);
const io = initializeSocketServer(httpServer);
app.set("io", io);




connectDB()
.then(()=>{
    const port = process.env.PORT || 8000;
    httpServer.listen(port, ()=>{
        console.log(`server is running at port: ${port}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!",err)
})
