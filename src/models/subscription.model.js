import mongoose , {Schema} from "mongoose";
import { User } from "./user.model.js";

const subscriptionSchema = new Schema({
    
        subscriber: {
            type: Schema.Types.ObjectId, // channel to whom the user is subscribed 
            ref: 'User'
        },
        channel: {
            type: Schema.Types.ObjectId, // subscriber who has subscribed the user(channel)
            ref: 'User'
        }

    
},{timestamps: true})

// every time the user subscribe or subscribed by other user a new document(subscriptionschema) is created 
// To find the subscribers of a user(channel) we find($match) the documents of a channel(channelname or username) 
// To find the channel to whom the user(channel) is a subscriber of (or is subscribed to ) we find ($match) the documents of subscribers (users)

export const Subscription = mongoose.model('Subscription', subscriptionSchema)