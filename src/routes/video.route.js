import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    getAllVideos, 
    publishVideo,
    getVideoById, 
    updateVideoById,
    deleteVideoById,
    togglePublishStatus } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route('/')
    .get(getAllVideos)
    .post(
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

router.route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideoById)
    .delete(deleteVideoById)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router
