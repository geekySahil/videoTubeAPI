import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments,addComment,updateComment,deleteComment } from "../controllers/comment.controller.js";
import { Router } from "express";


const router = Router();


router.route("/comments").get(verifyJWT, getVideoComments)
router.route("/add-comment").post(verifyJWT, addComment)
router.route("/update-comment").patch(verifyJWT, updateComment)
router.route("/delete-comment").post(verifyJWT, deleteComment)

export default router