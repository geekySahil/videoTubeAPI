import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(401, "video not found ")
    }

    if(!userId){
        throw new ApiError(401, "unauthorized access first login please")
    }

    const credentials = {video: videoId, likedBy: userId}


    const like = await Like.findOne(credentials);

    if(!like){
        const createdLike = await Like.create({credentials})

        if(!createdLike){
            throw new ApiError(401, "something went wrong while liking")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, createdLike, "Liked successfully"))
    }
    else{
        const deleteResponse = await Like.deleteOne({credentials})

        if(!deleteResponse){
            throw new ApiError(401, "something went wrong while unliking")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "unliked successfully"))
    }


    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id
    //TODO: toggle like on comment
    if(!commentId){
        new ApiError(401, "something went wrong while liking comment")
    }

    if(!userId){
        new ApiError(401, "unauthorized access please login first")
    }

    const credentials = {comment: commentId, likedBy: userId}

    const like = await Like.findOne(credentials);

    if(!like){
        const createdLike = await Like.create(credentials);
        if(!createdLike){
            throw new ApiError(401, "something went wrong while liking this comment")
        }

        return res.
        status(200)
        .json(new ApiResponse(200, createdLike, "liked successfully"));
    }
    else{
        const deleteResponse = await Like.deleteOne(credentials)
        if(!deleteResponse){
            throw new ApiError(401, "something went wrong while unliking the comment")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "unliked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user?._id
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(401, "tweet not found ")
    }

    if(!userId){
        throw new ApiError(401, "unauthorized access first login please")
    }

    const credentials = {tweet: tweetId, likedBy: userId}


    const like = await Like.findOne(credentials);

    let liked;

    if(!like){
        const createdLike = await Like.create({credentials})

        if(!createdLike){
            throw new ApiError(401, "something went wrong while liking")
        }
        liked = true;
        return res
        .status(200)
        .json(new ApiResponse(200, createdLike, "Liked successfully"))
    }
    else{
        const deleteResponse = await Like.deleteOne({credentials})

        if(!deleteResponse){
            throw new ApiError(401, "something went wrong while unliking")
        }

        liked: false ;
        
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "unliked successfully"))
    }


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10, query , userId} = req.params
    // TODO: get all liked videos
    // const userId = req.user?._id;

    page===isNaN(page) ? 0 : page;
    limit===isNaN(limit) ? 10 : limit

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as : "likedVideos",

                pipeline:[
                    {
                        $project:{
                            videoFile:1, 
                            thumbnail: 1, 
                            title: 1 ,
                            description: 1, 
                            createdAt:1,
                            owner:1,

                        }
                    }
                ]
            }
        },
      
        {
            $addFields:{
                likedVideos: {
                    $first: "$likedVideos"
                }
            }
        },
        {
            $project:{
                _id: 0,
                likedVideos: 1
            }
        },
        {
            $replaceRoot: { newRoot: "$likedVideos" }
        },
        {
            $sort: {createdAt : -1 }
        },
        {
            $skip: (page-1)*limit
        },
        {
            $limit: limit 
        }
    ]) 

    if(!likedVideos){
        throw new ApiError(401, "cannot find videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {likedVideos, videosCount: likedVideos.length} , "likes videos fetched successfully."))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}