import {Router}  from "express";
import {getCollegeById,getColleges,requestCollege,getListingsByCollege} from "../controllers/college.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router =Router();

router.route('/').get(getColleges)
router.route('/requestCollege').post(requestCollege)
router.route('/:collegeId/listings').get(getListingsByCollege)
router.route('/:collegeId').get(getCollegeById)


export default router
