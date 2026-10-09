import { Router } from "express";
import { loginUser,logoutUser,registerUser,refreshAccessToken,getProfile, updateProfile,getUserById} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";



const router = Router()

router.route("/register").post(registerUser)
router.route("/update").patch(verifyJWT,upload.single("profilePic"),updateProfile)
router.route("/getProfile").get(verifyJWT,getProfile)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,  logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/:userId").get(getUserById)

export default router