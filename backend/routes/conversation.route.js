import { Router } from "express";
import {
  createConversation,
  getConversationById,
  getMyConversations,
} from "../controllers/conversation.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createConversation).get(verifyJWT, getMyConversations);
router.route("/:conversationId").get(verifyJWT, getConversationById);

export default router;
