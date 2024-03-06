import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos, publishVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route('/publish-video').post(
    upload.fields([
        {
            name: "videoFile",
            maxcount: 1
        },
        {
            name: "thumbnail",
            maxcount: 1
        }
    ]), publishVideo
)

export default router
