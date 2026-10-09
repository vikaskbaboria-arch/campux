import { isValidObjectId } from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const senderFields = "name username profilePic";

const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text } = req.body;
  const senderId = req.user?._id;

  if (!isValidObjectId(conversationId)) {
    throw new ApiError(400, "A valid conversationId is required");
  }
  if (typeof text !== "string" || !text.trim()) {
    throw new ApiError(400, "Message text is required");
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  if (!conversation.members.some((memberId) => String(memberId) === String(senderId))) {
    throw new ApiError(403, "You are not a member of this conversation");
  }

  const message = await Message.create({
    conversationId,
    sender: senderId,
    text: text.trim(),
    readBy: [senderId],
  });

  conversation.lastMessage = message.text;
  await conversation.save();
  await message.populate("sender", senderFields);

  const io = req.app.get("io");
  if (io) {
    let recipients = io.to(`conversation:${conversationId}`);
    conversation.members.forEach((memberId) => {
      recipients = recipients.to(`user:${memberId}`);
    });
    recipients.emit("message:new", message.toObject());
  }

  return res
    .status(201)
    .json(new ApiResponse(201, message, "Message sent successfully"));
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  if (!isValidObjectId(conversationId)) {
    throw new ApiError(400, "Invalid conversation ID");
  }

  const conversation = await Conversation.findById(conversationId).select("members");
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  if (!conversation.members.some((memberId) => String(memberId) === String(req.user?._id))) {
    throw new ApiError(403, "You are not a member of this conversation");
  }

  const messages = await Message.find({ conversationId })
    .populate("sender", senderFields)
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  if (!isValidObjectId(messageId)) {
    throw new ApiError(400, "Invalid message ID");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const conversation = await Conversation.findById(message.conversationId).select("members");
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  if (!conversation.members.some((memberId) => String(memberId) === String(req.user?._id))) {
    throw new ApiError(403, "You are not a member of this conversation");
  }

  message.readBy.addToSet(req.user._id);
  await message.save();
  await message.populate("sender", senderFields);

  const senderId = String(message.sender?._id || message.sender);
  const readerId = String(req.user._id);
  if (senderId !== readerId) {
    req.app.get("io")
      ?.to(`user:${senderId}`)
      .emit("message:read", { messageId: String(message._id), readerId });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message marked as read"));
});

export { sendMessage, getMessages, markMessageAsRead };
