import mongoose from "mongoose";
import cookieParser from "cookie-parser"
import cors from "cors"
import express from 'express'
import router from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js";
import subsciptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import tweetRouter from "./routes/tweet.route.js"
import playlistRouter from "./routes/playlist.route.js"
import healthCheckRouter from "./routes/healthcheck.route.js";

const app = express()

// Setting Middlewares 

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
}))

app.use(express.json({limit:"16kb"})) // parse incoming json request .
app.use(express.urlencoded({extended:true, limit: "16kb"})) // to enable the parsing of URL-encoded form data
app.use(express.static("public")) // serve static files 
app.use(cookieParser()) // parse cookies which are set by route handlers in server 


app.use('/api/v1/users', router)
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/subscriptions', subsciptionRouter )
app.use('api/v1/comments', commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/health", healthCheckRouter)




export {app}

