import mongoose, { Schema, isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const subsId = req.user._id;

    if (!subsId) {
        throw new APIError(401, "You are not subscribed")
    }

    if (!channelId) {
        throw new APIError(404, "something went wrong while subscribing the channel")
    }

    const subscribed = await Subscription.findOne({ subscriber: subsId, channel: channelId })

    if (!subscribed) {
        const createdSubscriber = await Subscription.create({ subscriber: subsId, channel: channelId })
        if (!createdSubscriber) {
            throw new APIError(401, "Error: something went wrong while subscribing")
        }

        return res
            .status(200)
            .json(new APIResponse(200, createdSubscriber, "Subscribed Successfully."))


    }
    else {
        const unsubscribe = await Subscription.deleteOne({ subscriber: subsId, channel: channelId })
        if (!unsubscribe) {
            throw new APIError(500, "Error : something went wrong while unsubscribing")
        }

        return res
            .status(200)
            .json(new APIResponse(200, unsubscribe, "Unsubscribed Successfully"))
    }






})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => { 
    const { channelId } = req.params 


    const Subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField: subscriber,
                foreignField: _id,
                as: "subscriberDetails",
                pipeline:[
                    {
                        $project:{
                            username: 1, 
                            fullname: 1, 
                            avatar:1
                        }
                    }
                ]
            },

        },
        {
            $addFields:{
                $first: "subscriberDetails"
            }
        },
        {
            $project: {
                subscriberDetails: 1,
                _id: 0
            }
        },
        {
            $replaceRoot:{
                newRoot: "subscriberDetails"
            }
        }
    ])
    if(!Subscribers){
        throw new APIError(500, "cant fetch subscribers")
    }

    return res.status(200)
            .json(new APIResponse(200, Subscribers, "List fetched successfully"))
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new APIError(404, "Cannot fetch subscriptions of user ")
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField: "channel",
                foreignField: "_id",
                as : "subscriptionsDetails",

                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname: 1, 
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                $first: "subscriptionsDetails"
            }
        },
        {
            $project:{
                _id:0,
                subsciptionsDetails: 1
            }
        },
        {
            $replaceRoot:{
                newRoot: "subscriptionsDetails"
            }
        }
    ])

    if(!subscriptions){
        throw new APIError(500 ,"Error while fetching subscriptions of user ")
    }

    return res
    .status(200)
    .json(new APIResponse(200, subscriptions, "subsciptions fetched successfully"))

    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}