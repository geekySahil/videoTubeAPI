import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getLikedVideos, toggleTweetLike, toggleVideoLike, toggleCommentLike} from "../controllers/like.controller.js"

const router = Router();

router.use(verifyJWT)

router.route("/liked-videos").get(getLikedVideos);

router.route("/toggle/t/:tweetId").post(toggleTweetLike)

router.route("/toggle/v/:videoId").post(toggleTweetLike)

router.route("/toggle/c/:commentId").post(toggleTweetLike)


export default router
