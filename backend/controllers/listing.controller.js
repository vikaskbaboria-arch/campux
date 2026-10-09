import Listing from "../models/listing.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadImage } from "../services/imageUpload.service.js";
import { isValidObjectId } from "mongoose";

const createListing = asyncHandler(async (req, res) => {
  const { title, description, price, category, condition } = req.body;
  console.log("body", req.body);
  console.log("BODY:", req.body);
  console.log("USER:", req.user);
  console.log("FILES:", req.files);

  if (!title || !description || !condition || !price || !category) {
    throw new ApiError(400, "information is required for the listing");
  }
  const images = await uploadImage(req.files);
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, "user not authorized");
  }
  const seller = await User.findById(userId).select("-password -refreshToken");
  if (!seller.college) {
    throw new ApiError(400, "First add colleg to profile");
  }

  const listItem = await Listing.create({
    title,
    description,
    seller: seller._id,
    college: seller.college,
    price,
    category,
    condition,
    status: "Available",
    images,
  });
  if (!listItem) {
    throw new ApiError(500, "listing not created");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, listItem, "item successfuly created"));
});
const getListings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    category,
    condition,
    status,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
  const filter = {};
  const userId = req.user._id;
  const user = await User.findById(userId).select("college");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.college) {
    throw new ApiError(400, "Please add a college to your profile");
  }

  filter.college = user.college;

  if (category && category !== "All") {
    filter.category = category;
  }

  if (condition && condition !== "All") {
    filter.condition = condition;
  }

  if (status && status !== "All") {
    filter.status = status;
  }

  if (query?.trim()) {
    filter.$or = [
      {
        title: {
          $regex: query.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: query.trim(),
          $options: "i",
        },
      },
    ];
  }
  const sort = {
    [sortBy]: sortType === "desc" ? -1 : 1,
  };

  const skip = (pageNumber - 1) * limitNumber;
  const [listing, total] = await Promise.all([
    Listing.find(filter)
      .populate("college", "name shortName")
      .populate("seller", "name username profilePic email")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    Listing.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        listing,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
          hasNextPage: pageNumber < Math.ceil(total / limitNumber),
          hasPreviousPage: pageNumber > 1,
        },
      },
      "Colleges fetched successfully",
    ),
  );
});

const getListingById = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  if (!isValidObjectId(listingId)) {
    throw new ApiError(400, "ListingId is required");
  }
  const listedItem = await Listing.findById(listingId)
    .populate("seller", "name username profilePic")
    .populate("college", "name shortName");
  if (!listedItem) {
    throw new ApiError(404, "Listing not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, listedItem, "Listed item found succesfuly"));
});
const updateListing = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const { title, description, price, category, condition, status, listingId } = req.body;
  if (!isValidObjectId(listingId)) {
    throw new ApiError(400, "Invalid listing ID");
  }
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  if (String(userId) !== String(listing.seller)) {
    throw new ApiError(403, "You can only edit your own listing");
  }
  const formData = {};
  if (title !== undefined) {
    formData.title = title;
  }
  if (description !== undefined) {
    formData.description = description;
  }
  if (price !== undefined) {
    formData.price = price;
  }
  if (category !== undefined) {
    formData.category = category;
  }
  if (condition !== undefined) {
    formData.condition = condition;
  }
  if (status !== undefined) {
    formData.status = status;
  }
  if (req.files?.length) {
    formData.images = await uploadImage(req.files);
  }
  const updatedListedItem = await Listing.findByIdAndUpdate(
    listingId,
    {
      $set: formData,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("seller", "name username profilePic")
    .populate("college", "name shortName");
  if (!updatedListedItem) {
    throw new ApiError(500, "item not updated");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedListedItem, "item succesfuly updated"));
});
const getMyListings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const listings = await Listing.find({ seller: userId })
    .populate("seller", "name username profilePic")
    .populate("college", "name shortName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, listings, "Your listings fetched successfully"));
});

const getListingsBySeller = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const listings = await Listing.find({ seller: userId })
    .populate("seller", "name username profilePic")
    .populate("college", "name shortName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, listings, "Seller listings fetched successfully"));
});

const deleteListing = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(listingId) || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid listing or user ID");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  if (String(listing.seller) !== String(userId)) {
    throw new ApiError(403, "You can only delete your own listing");
  }

  await listing.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, { listingId }, "Listing deleted successfully"));
});

const markAsSold = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(listingId) || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid listing or user ID");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  if (String(listing.seller) !== String(userId)) {
    throw new ApiError(403, "You can only mark your own listing as sold");
  }
  if (listing.status === "Sold") {
    throw new ApiError(400, "This listing is already marked as sold");
  }

  listing.status = "Sold";
  await listing.save();
  await listing.populate([
    { path: "seller", select: "name username profilePic" },
    { path: "college", select: "name shortName" },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, listing, "Listing marked as sold"));
});

export { createListing, getListings, getListingById, updateListing, getMyListings, getListingsBySeller, deleteListing, markAsSold };
