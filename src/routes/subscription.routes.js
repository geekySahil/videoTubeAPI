import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers } from "../controllers/subscription.controller.js";



const router = Router();


router.route("/toggle-subscriptions").post(verifyJWT, toggleSubscription)
router.route("get-subscribers").get(verifyJWT, getSubscribedChannels)
router.route("get-subscriptions").get(verifyJWT, getUserChannelSubscribers)


export default router