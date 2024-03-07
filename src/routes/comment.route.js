import { Router } from "express";
import { addComment, updateComment, deleteComment, getVideoComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/:videoId").post(addComment);

router.route("/:commentId").patch(updateComment).delete(deleteComment)

export default router;