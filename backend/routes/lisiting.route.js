import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

import { createListing, getListingById, getListings, getMyListings, getListingsBySeller, updateListing, deleteListing, markAsSold } from "../controllers/listing.controller.js";

const router = Router()

router.route("/addListing").post(verifyJWT,upload.array("images",10),createListing);
router.route("/").get(verifyJWT,getListings)
router.route("/updateItem").patch(verifyJWT,upload.array("image",10),updateListing)
router.route("/getMylistings").get(verifyJWT,getMyListings)
router.route("/seller/:userId").get(getListingsBySeller)
router.route("/markAsSold/:listingId").patch(verifyJWT, markAsSold)
router.route("/:listingId").delete(verifyJWT, deleteListing)
router.route("/:listingId").get(getListingById)

export default router
