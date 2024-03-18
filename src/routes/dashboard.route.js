import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getChannelStats} from "../controllers/dashboard.controller.js"

const router = Router();
router.use(verifyJWT) // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats)

export default router