import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";


const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body; 
    //TODO: create tweet


    if(!req.user?._id || !isValidObjectId(req.user?._id)){
        throw new APIError(401, "Sorry You are not Logged in ")
    }

    if(!content){
        throw new APIError(401, "content is reqired ")
    }


    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new APIError(500, "Failed To create tweet ")
    }

    return res
    .status(200)
    .json(new APIResponse(201, "Tweet Created Successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user?._id;

    if(!userId || !isValidObjectId(userId)){
        throw new APIError(401, "UserId is not valid maybe you are not logged in ")
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $sort:{
                createdAt: -1
            }
        },
        
    ])

    if(!tweets){
        throw new APIError(401, "Failed to fetch tweet")
    }

    return res
    .status(200)
    .json(new APIResponse(200, tweets, "Tweets fetched Successfully "))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const content = req.body;
    //TODO: update tweet

    if(!content){
        throw new APIError(401, "new content is required")
    }

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new APIError(401, "tweet not found ")
    }

    const tweet = await Tweet.findById(tweetId)

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new APIError(401 , "Please Login first ")
    }


    tweet.content = content;
    await tweet.save({ validateBeforeSave: false })
    

    if(!tweet){
        throw new APIError(401, "Something Went wrong while updating tweet")
    }

    return res
    .status(200)
    .json(200, tweet , "Tweet Updated Successfully")
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if(!tweetId){
        throw new APIError(401, "TweetId Not Found")
    }

    const tweet = await Tweet.findById(tweetId)

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new APIError(401, "Please Login First ")
    }

    const deletedTweet = await tweet.remove()

    if(!deleteTweet){
        throw new APIError(500, "Failed To delete Tweet ")
    }
    
    return res
    .status(200)
    .json(new APIResponse(401 , {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}