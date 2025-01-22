import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { publishAVideo, getAllVideos, getVideoById, updateVideo, togglePublishStatus, deleteVideo } from "../controllers/video.controller.js";

const videoRouter = Router();


videoRouter.route("/").get(verifyJWT, getAllVideos);


videoRouter.route("/").post(upload.fields(
    [
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbNail",
            maxCount: 1
        }
    ]
), publishAVideo)

videoRouter.route("/:videoId").get(verifyJWT, getVideoById);

videoRouter.route("/:videoId").patch(verifyJWT,upload.single("thumbnail"), updateVideo)

videoRouter.route("/toggle/publish/:videoId").post(verifyJWT, togglePublishStatus)

videoRouter.route("/:videoId").delete(verifyJWT, deleteVideo)

export default videoRouter 