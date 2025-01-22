import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    page === NaN ? 0 : page;
    limit === NaN ? 10 : limit;

    if (!videoId) {
        throw new ApiError(400, "couldn't find video")
    }

    // const comments = await Comment.find(videoId);


    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"

            }
        },

        {
            $addFields: {
                
                    $first: '$owner'
                
            }


        },
        {
            $addFields: {
                $size: "$likes" 
            }
        },
        
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }


    ])

    if (comments.length === 0) {
        throw new ApiError(400, "No comments yet ");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, comments, "Comments found successfully"))



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params

    if (!videoId) {
        throw new error(400, "Video not found ");
    }



    const addedComment = await Comment.create({
        content: content,
        video: videoId,
        user: req.user?._id
    })

    if (!addedComment) {
        throw new ApiError(400, "Couldn't add comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, addedComment, "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params;
    const newContent = req.body;

    if (!commentId) {
        throw new ApiError(400, "Login to Update Comment")
    }

    const comment = await findById(commentId)

    if (comment.owner.toString() !== req.user?._id) {
        throw new ApiError(401, "unauthorized access")
    }


    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content,
            },
        },
        {
            new: true,
        }
    )

    if (!updatedComment) {
        throw ApiError(500, "Someting went wrong while updating comment")
    }


    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params;

    if (!commentId) {
        throw new ApiError(400, "Login to delete Comment")
    }

    const comment = await findById(commentId)

    if (comment.user !== req.user?._id) {
        throw new ApiError(401, "unautorized access")
    }
    const deleteResponse = await Comment.findByIdAndDelete(commentId)

    if (!deleteResponse) {
        throw ApiError(500, "Someting went wrong while delelting comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "comment delete successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}