import { Router } from "express";
import {
  getMessages,
  markMessageAsRead,
  sendMessage,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, sendMessage);
router.route("/:conversationId").get(verifyJWT, getMessages);
router.route("/:messageId/read").patch(verifyJWT, markMessageAsRead);

export default router;
