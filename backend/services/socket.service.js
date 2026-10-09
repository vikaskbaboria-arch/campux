import { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Conversation from "../models/conversation.model.js";
import User from "../models/User.model.js";

export const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CORS_ORIGIN === "*"
          ? true
          : process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select("_id");
      if (!user) {
        return next(new Error("Invalid access token"));
      }

      socket.data.userId = String(user._id);
      return next();
    } catch {
      return next(new Error("Invalid access token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (payload = {}, acknowledge) => {
      const conversationId = payload.conversationId;
      if (!isValidObjectId(conversationId)) {
        acknowledge?.({ success: false, message: "Invalid conversation ID" });
        return;
      }

      try {
        const isMember = await Conversation.exists({
          _id: conversationId,
          members: userId,
        });

        if (!isMember) {
          acknowledge?.({ success: false, message: "Not a conversation member" });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        acknowledge?.({ success: true });
      } catch {
        acknowledge?.({ success: false, message: "Could not join conversation" });
      }
    });

    socket.on("conversation:leave", (payload = {}) => {
      if (isValidObjectId(payload.conversationId)) {
        socket.leave(`conversation:${payload.conversationId}`);
      }
    });
  });

  return io;
};
