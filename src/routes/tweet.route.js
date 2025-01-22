import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {createTweet, deleteTweet, updateTweet , getUserTweets} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTweet)

router.route("/:tweetId")
        .delete(deleteTweet)
        .patch(updateTweet)
        
router.route("/tweets/:userId").get(getUserTweets)

export default router