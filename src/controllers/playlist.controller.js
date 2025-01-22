import { Playlist } from "../models/playlist.model.js";
import mongoose, {isValidObjectId} from "mongoose";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    const userId = req.user?._id;

    if(!userId){
        throw new APIError(401, "User not logged in")
    }

    const playlist = await Playlist.create({name: name.trim(), description: description.trim(), owner: userId})

    if(!playlist){
        throw new APIError(401, "Something went wrong while creating playlist ")
    }

    return res
    .status(200)
    .json(new APIResponse(201, playlist, "Playlist Created Successfully"))
    

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists


    if(!userId){
        throw new APIError(401, "userId does not exist ");
    }

    const user = await User.findById(userId)


    const userPlaylists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res
    .status(200)
    .json(new APIResponse(200, userPlaylists , "Fetched Playlist successfully "))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistid){
        throw new APIError(401, "Playlist Id is not valid ")
    }

    const playlist = await Playlist.findById(playlistId);

   
    if(!playlist){
        throw new APIError(401, "playlist not found")
    }

    return res
    .status(200)
    .json(new APIResponse(200, playlist , "playlist fetched successfull"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!(playlistId || videoId)){
        throw new APIError(401, "PlaylistId or videoId not defined ")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist?.owner !== req.user?._id){
        throw new APIError(400, "Please Login First ")
    }

    const newPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $push: { videos: videoId }
    }, {new: true});

    if(!newPlaylist){
        throw new APIError(401, "playlist not updated ")
    }

    return res
    .status(200)
    .json(new APIResponse(200, newPlaylist, "video pushed successfully"))

    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!(playlistId || videoId)){
        throw new APIError(401, "PlaylistId or videoId is missing")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!(playlist?.owner === req.user?._id)){
        throw new APIError(400, "Please Login First ")
    }

   

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull:{videos: videoId}
    }, {new : true})

    if(!updatedPlaylist){
        throw new APIError(401, "Failed to delete video from playlist. ")
    }

    return res
    .status(200)
    .json(new APIResponse(200, updatedPlaylist , "Video deleted Successfully!"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new APIError(401, "playlist not found ")
    }

    const deleteResponse = await Playlist.findByIdAndDelete(playlistId)

    if(!deleteResponse){
        throw new APIError(401, "Some error occured while deleting playlist ")
    }

    return res
    .status(200)
    .json(new APIResponse(200, {}, "Playlist deleted successfully "))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId){
        throw new APIError(401, "Playlist not found")
    }

    if(!name && !description){
        throw new APIError(400, "atleast one field is reqired")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set:{
            name: name || updatePlaylist.name ,
            description: description || updatePlaylist.description
        }
    }, {new: true})

    if(!updatedPlaylist){
        throw new APIError(401, "Failed to update playlist")
    }

    return res
    .status(200)
    .json(new APIResponse(200, updatedPlaylist , "playlist updated successfully"))


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}