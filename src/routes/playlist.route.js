import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getUserPlaylists, getPlaylistById, createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist} from "../controllers/playlist.controller.js"

const router = Router();

router.use(verifyJWT)

router.route("/user/:userId").get(getUserPlaylists);
router.route("/").post(createPlaylist)


router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)


router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/delete/:videoId/:playlistId").patch(removeVideoFromPlaylist)


export default router