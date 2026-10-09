import mongoose,{isValidObjectId} from "mongoose";

import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import College from "../models/college.model.js";
import Listing from "../models/listing.model.js";
const requestCollege = asyncHandler(
    async(req,res)=>{
        const {name,location,shortName,collegesite}= req.body;
        
        if(!name || !location ) {
            throw new ApiError(400,"name and location is required");
        }
        
        const {city, state, pincode} = location;
        if(!city || !state || !pincode){
            throw new ApiError(400,"location is required")
        }
       
        const collegeAlraedy = await College.findOne({
            name,
            "location.city":city,
            "location.state":state
        });
        if(collegeAlraedy){
            throw new ApiError(400,"college already exists")
        }
        const college = await College.create({
            name:name.trim(),
            shortName:shortName.trim(),
            location:{
                city:city.trim(),
                state:state.trim(),
                pincode:pincode.toString().trim()
            },
             collegeSite: collegeSite?.trim() || "",
             requestedBy:req.user?._id,
             isVerified:false
        })

        if(!college){
            throw new ApiError(500,"Failed to create college")
        }
        return res
        .status(200)
        .json(
        new ApiResponse(200,college,"college Submite SuccesFUlly")
        )
    }
)

const getColleges = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "name",
        sortType = "asc"
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);

    const filter = {};

    // Search by college name, short name, city or state
    if (query?.trim()) {
        filter.$or = [
            {
                name: {
                    $regex: query.trim(),
                    $options: "i"
                }
            },
            {
                shortName: {
                    $regex: query.trim(),
                    $options: "i"
                }
            },
            {
                "location.city": {
                    $regex: query.trim(),
                    $options: "i"
                }
            },
            {
                "location.state": {
                    $regex: query.trim(),
                    $options: "i"
                }
            }
        ];
    }

    const sort = {
        [sortBy]: sortType === "desc" ? -1 : 1
    };

    const skip = (pageNumber - 1) * limitNumber;

    const [colleges, total] = await Promise.all([
        College.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),

        College.countDocuments(filter)
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    colleges,
                    pagination: {
                        page: pageNumber,
                        limit: limitNumber,
                        total,
                        totalPages: Math.ceil(total / limitNumber),
                        hasNextPage:
                            pageNumber < Math.ceil(total / limitNumber),
                        hasPreviousPage:
                            pageNumber > 1
                    }
                },
                "Colleges fetched successfully"
            )
        );
});
const getCollegeById = asyncHandler(
    async(req,res)=>{
        const {collegeId} = req.params;
         if (!isValidObjectId(collegeId)) throw new ApiError(400, 'Invalid video ID')
      
        const college = await College.findById(collegeId);
        if(!college){
            throw new ApiError(404,"college Not FOund")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                college,
                "College SuccessFully Found"
            )
        )
    }
)

const getListingsByCollege = asyncHandler(async(req, res) => {
    const { collegeId } = req.params;
    if (!isValidObjectId(collegeId)) {
        throw new ApiError(400, "Invalid college ID");
    }

    const college = await College.findById(collegeId).select("_id");
    if (!college) {
        throw new ApiError(404, "College not found");
    }

    const listings = await Listing.find({ college: college._id })
        .populate("seller", "name username profilePic")
        .populate("college", "name shortName")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, listings, "College listings fetched successfully")
    );
});

const updateCollege = asyncHandler(
    async(req,res)=>{
        
    }
)

export {getCollegeById,getColleges,requestCollege,getListingsByCollege};
