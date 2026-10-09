import Conversation from "../models/conversation.model.js";

export const getOrCreateConversation = async (members, io) => {
  const existingConversation = await Conversation.findOne({
    members: { $all: members, $size: 2 },
  });

  if (existingConversation) {
    return { conversation: existingConversation, created: false };
  }

  const conversation = await Conversation.create({ members });
  members.forEach((memberId) => {
    io?.to(`user:${memberId}`).emit("conversation:new", {
      conversationId: String(conversation._id),
    });
  });

  return { conversation, created: true };
};
