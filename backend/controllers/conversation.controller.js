import { isValidObjectId } from "mongoose";
import Conversation from "../models/conversation.model.js";
import User from "../models/User.model.js";
import { getOrCreateConversation } from "../services/conversation.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const memberFields = "name username profilePic college";

const createConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(currentUserId) || !isValidObjectId(recipientId)) {
    throw new ApiError(400, "A valid recipientId is required");
  }
  if (String(currentUserId) === String(recipientId)) {
    throw new ApiError(400, "You cannot start a conversation with yourself");
  }

  const recipientExists = await User.exists({ _id: recipientId });
  if (!recipientExists) {
    throw new ApiError(404, "Recipient not found");
  }

  const members = [currentUserId, recipientId];
  const { conversation, created } = await getOrCreateConversation(
    members,
    req.app.get("io"),
  );

  await conversation.populate("members", memberFields);
  return res
    .status(created ? 201 : 200)
    .json(new ApiResponse(created ? 201 : 200, conversation, "Conversation ready"));
});

const getMyConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;
  if (!isValidObjectId(currentUserId)) {
    throw new ApiError(401, "Unauthorized request");
  }

  const conversations = await Conversation.find({ members: currentUserId })
    .populate("members", memberFields)
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
});

const getConversationById = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  if (!isValidObjectId(conversationId)) {
    throw new ApiError(400, "Invalid conversation ID");
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const isMember = conversation.members.some(
    (memberId) => String(memberId) === String(req.user?._id),
  );
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this conversation");
  }

  await conversation.populate("members", memberFields);

  return res
    .status(200)
    .json(new ApiResponse(200, conversation, "Conversation fetched successfully"));
});

export { createConversation, getMyConversations, getConversationById };
