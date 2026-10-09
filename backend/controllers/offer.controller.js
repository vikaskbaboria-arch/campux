import Offer from "../models/offer.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Listing from "../models/listing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { getOrCreateConversation } from "../services/conversation.service.js";




const createOffer = asyncHandler(async (req, res) => {

    const { listingId, offerPrice } = req.body;

    // Validate listing ID
    if (!listingId || !isValidObjectId(listingId)) {
        throw new ApiError(400, "Invalid listing ID");
    }

    // Validate offer price
    if (
        offerPrice === undefined ||
        offerPrice === null ||
        !Number.isFinite(Number(offerPrice)) ||
        Number(offerPrice) <= 0
    ) {
        throw new ApiError(400, "Offer price must be greater than 0");
    }

    const buyer = req.user._id;

    if (!isValidObjectId(buyer)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find listing
    const listing = await Listing.findById(listingId);

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    // Don't allow seller to offer on own listing
    if (listing.seller.toString() === buyer.toString()) {
        throw new ApiError(
            400,
            "You cannot make an offer on your own listing"
        );
    }

    // Don't allow offers on unavailable listings
    if (listing.status !== "Available") {
        throw new ApiError(
            400,
            "This listing is no longer available"
        );
    }

    const numericOfferPrice = Number(offerPrice);
    if (numericOfferPrice > listing.price) {
        throw new ApiError(
            400,
            "Offer price cannot be greater than the listing price"
        );
    }

    await getOrCreateConversation(
        [buyer, listing.seller],
        req.app.get("io"),
    );

    const offerCreated = await Offer.create({
        listing: listingId,
        offerPrice: numericOfferPrice,
        buyer,
        status: "Pending"
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            offerCreated,
            "Offer created successfully"
        )
    );
});
const getSentOffers = asyncHandler(
    async (req, res) => {
        const userId = req.user._id;
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }

        const offers = await Offer.find({ buyer: userId })
            .populate({
                path: "listing",
                populate: [
                    { path: "seller", select: "name username profilePic" },
                    { path: "college", select: "name shortName" },
                ],
            })
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, offers, "Sent offers fetched successfully"));
    }
)
const getReceivedOffers = asyncHandler(
    async (req, res) => {
        const userId = req.user._id;
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }

        const sellerListings = await Listing.find({ seller: userId }).select("_id");
        const listingIds = sellerListings.map((listing) => listing._id);
        const offers = await Offer.find({ listing: { $in: listingIds } })
            .populate("buyer", "name username profilePic")
            .populate({
                path: "listing",
                populate: [
                    { path: "seller", select: "name username profilePic" },
                    { path: "college", select: "name shortName" },
                ],
            })
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, offers, "Received offers fetched successfully"));
    }
)

const populateOfferDetails = (offerId) =>
    Offer.findById(offerId)
        .populate("buyer", "name username profilePic")
        .populate({
            path: "listing",
            populate: [
                { path: "seller", select: "name username profilePic" },
                { path: "college", select: "name shortName" },
            ],
        });

const acceptOffer = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(offerId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid offer or user ID");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    const listing = await Listing.findById(offer.listing);
    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }
    if (listing.status !== "Available") {
        throw new ApiError(400, "This listing is no longer available");
    }

    let acceptedPrice;
    if (offer.status === "Pending") {
        if (String(listing.seller) !== String(userId)) {
            throw new ApiError(403, "Only the seller can accept this offer");
        }
        acceptedPrice = offer.offerPrice;
    } else if (offer.status === "Countered") {
        if (String(offer.buyer) !== String(userId)) {
            throw new ApiError(403, "Only the buyer can accept this counteroffer");
        }
        acceptedPrice = offer.counterOfferPrice;
    } else {
        throw new ApiError(400, "This offer has already been resolved");
    }

    offer.status = "Accepted";
    offer.acceptedPrice = acceptedPrice;
    await offer.save();

    return res.status(200).json(
        new ApiResponse(200, await populateOfferDetails(offer._id), "Offer accepted successfully")
    );
});

const rejectOffer = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(offerId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid offer or user ID");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    const listing = await Listing.findById(offer.listing);
    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    if (offer.status === "Pending" && String(listing.seller) !== String(userId)) {
        throw new ApiError(403, "Only the seller can reject this offer");
    }
    if (offer.status === "Countered" && String(offer.buyer) !== String(userId)) {
        throw new ApiError(403, "Only the buyer can reject this counteroffer");
    }
    if (!["Pending", "Countered"].includes(offer.status)) {
        throw new ApiError(400, "This offer has already been resolved");
    }

    offer.status = "Rejected";
    await offer.save();

    return res.status(200).json(
        new ApiResponse(200, await populateOfferDetails(offer._id), "Offer rejected successfully")
    );
});

const counterOffer = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const { counterOfferPrice } = req.body;
    const userId = req.user._id;
    if (!isValidObjectId(offerId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid offer or user ID");
    }
    if (
        counterOfferPrice === undefined ||
        counterOfferPrice === null ||
        !Number.isFinite(Number(counterOfferPrice)) ||
        Number(counterOfferPrice) <= 0
    ) {
        throw new ApiError(400, "Counteroffer must be greater than 0");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    const listing = await Listing.findById(offer.listing);
    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }
    if (String(listing.seller) !== String(userId)) {
        throw new ApiError(403, "Only the seller can make a counteroffer");
    }
    if (offer.status !== "Pending") {
        throw new ApiError(400, "Only pending offers can be countered");
    }
    if (listing.status !== "Available") {
        throw new ApiError(400, "This listing is no longer available");
    }

    const amount = Number(counterOfferPrice);
    if (amount > listing.price) {
        throw new ApiError(400, "Counteroffer cannot be greater than the listing price");
    }

    offer.counterOfferPrice = amount;
    offer.counterOfferBy = userId;
    offer.status = "Countered";
    await offer.save();

    return res.status(200).json(
        new ApiResponse(200, await populateOfferDetails(offer._id), "Counteroffer sent successfully")
    );
});


export { createOffer, getSentOffers, getReceivedOffers, acceptOffer, rejectOffer, counterOffer }
