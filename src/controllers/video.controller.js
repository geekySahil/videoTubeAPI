import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


    let pageNumber = isNaN(page) ? 1 : Number(page);
    let itemsPerPage = isNaN(limit) ? 10 : Number(limit);

    if (pageNumber <= 0) {
        pageNumber = 1;
    }
    if (itemsPerPage <= 0) {
        itemsPerPage = 10;
    }

    const matchStage = {};

    if (userId && isValidObjectId(userId)) {
        matchStage["$match"] = {
            owner: new mongoose.Types.ObjectId[userId]
        }
    }
    else if (query) {
        matchStage["$match"] = {

            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }

            ]

        }
    }
    else if (userId && query) {
        matchStage["$match"] = {

            $and: [
                { owner: new mongoose.Types.ObjectId(userId)},

                {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }

                    ]
                }
            ]

        }
    }

    else {
        matchStage["$match"] = {}
    }

    const setOwnerStage = {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,   
                        fullname: 1,   
                        avatar: 1    
                    }
                }]
    }
}

    const addFieldsStage = {
        $addFields: {
            owner: { $arrayElemAt: ["$owner", 0] }
        }
    };

    const sortStage = {}

    if (sortBy && sortType) {
        sortStage["$sort"] = {
            sortType: sortBy === 'asc' ? 1 : -1
        }
    }
    else {
        sortStage["$sort"] = {
            createdAt: -1
        }
    }

    const skipStage = { $skip: (pageNumber - 1) * itemsPerPage };
    const limitStage = { $limit: itemsPerPage };


    const videos = await Video.aggregate([
        matchStage,
        setOwnerStage,
        addFieldsStage,
        sortStage,
        skipStage,
        limitStage
    ])


    return res.status(200).json(
        new APIResponse(200, videos, "videos fetched successfully")
    )



})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video


    const videoLocalPath = await req.files?.video[0]?.path
    const thumbNailLocalPath = await req.files?.thumbNail[0]?.path


    if (!videoLocalPath || !thumbNailLocalPath) {
        throw new APIError(401, "videoFile and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbNailLocalPath);

    const duration = await videoFile?.duration
    console.log(duration);

    if (!videoFile || !thumbnail) {
        throw new APIError(401, "failed to upload video ");
    }

    const newVideo = await Video.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        description,
        title,
        owner: req.user?._id,
        duration: Math.round(duration),
        isPublished: true

    })



    await newVideo.save({ validateBeforeSave: false })

    if (!newVideo) {
        throw new APIError(500, "Something went wrong while saving video into DB")
    }



    res
        .status(200)
        .json(
            new APIResponse(200, newVideo, "Video Uploaded and Published Successfully.")
        )




})


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    // const video = await Video.findById(videoId)
    // console.log(video)

    if (!videoId || !(mongoose.isValidObjectId(videoId))) {
        throw new APIError(404, "video does not exist ")
    }

    let video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",// The collection to join with
                localField: "owner",// Field from the 'video' collection (objectId of owner via 'User')
                foreignField: "_id", // Field fro the 'users' collection (_id created by mongoose )
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
                from: "likes", // likes model
                localField: "_id", // mongoose _id of video feild .
                foreignField: "video", // objectId in likes model.
                as: "likes", // new field name .

            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$likes",
                },
                views: {
                    $add: [1, ' $views']
                }
            }
        }
    ])

    if (video.length > 0) {
        video = video[0]
    }

    await Video.findByIdAndUpdate(videoId, {
        $set: {
            views: video.views
        }
    })

    return res.
        status(201)
        .json(
            200, video, "Single video found successfully "
        )
})


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;

    const updatedVideoFields = {}

    if (title?.trim()) {
        updatedVideoFields["title"] = title?.trim();
    }

    if (description?.trim()) {
        updatedVideoFields["description"] = description?.trim();
    }

    const newThumbNailLocalPath = req.file?.path
    let newThumbNail;
    if (newThumbNailLocalPath) {
        newThumbNail = await uploadOnCloudinary(newThumbNailLocalPath);
        updatedVideoFields["thumbnail"] = newThumbNail.url;
    }

    const prevVideo = await Video.findById(videoId);


    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                ...updatedVideoFields
            }
        }, { new: true })

    const deletedInfo = await deleteFromCloudinary(prevVideo?.thumbNail)

    if (!deletedInfo) {
        throw new APIError(500, "deletion faliled ")
    }



    if (!video) {
        throw new APIError(401, "video not found ")
    }


    return res.status(200).json(
        new APIResponse(200, video, "Video Details Updated Successfully")
    )

})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new APIError(400, "video id is required ");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new APIError(401, "video not found ")
    }


    if (video.owner?._id?.toString() !== req.user?._id?.toString()) {
        throw new APIError(404, "you cant delete this file ")
    }

    const { _id, videoFile, thumbnail } = video;

    const delResponse = await Video.findByIdAndDelete(videoId);  // _id bhi de sakte hain 

    if (delResponse) {
        await Promise.all([
            Like.deleteMany({ video: _id }),
            Comment.deleteMany({ video: _id }),
            deleteFromCloudinary(videoFile, "video"),
            deleteFromCloudinary(thumbnail)

        ])
    }

    if (!delResponse) {
        throw new APIError(500, "Failed to delete video from databasw");
    }

    return res.status(200).json(
        new APIResponse(200, {}, "video deleted successfully")
    )


})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new APIError(401, "Id not found")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: !isPublished
        }
    })

    if (video) {
        throw new APIError(401, "video not exist ")
    }



    const updated = await video.save({ validateBeforeSave: false })

    return res.status(200).json(
        new APIResponse(200, updated, "Toggled successfully.")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}