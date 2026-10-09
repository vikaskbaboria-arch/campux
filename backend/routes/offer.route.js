import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createOffer, getSentOffers, getReceivedOffers, acceptOffer, rejectOffer, counterOffer } from "../controllers/offer.controller.js";

const router = Router();

router.route("/createOffer").patch(verifyJWT, createOffer)
router.route("/sent").get(verifyJWT, getSentOffers)
router.route("/received").get(verifyJWT, getReceivedOffers)
router.route("/:offerId/accept").patch(verifyJWT, acceptOffer)
router.route("/:offerId/reject").patch(verifyJWT, rejectOffer)
router.route("/:offerId/counter").patch(verifyJWT, counterOffer)


export default router;
