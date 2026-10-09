import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {

    if(!req){
        throw new ApiError(400,"Invalid request")
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Everything is ok")
    );
})

export {
    healthcheck
    }
    
