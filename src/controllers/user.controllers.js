import { asyncHandler } from "../utils/asyncHandler.js";
import {APIError} from '../utils/APIError.js'
import { APIResponse } from "../utils/APIResponse.js";
import {User} from '../models/user.model.js'
import uploadOnCloudinary from "../utils/cloudinary.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

const generateRefreshandAccessToken = async(userId) => {
  try {
    const user = await User.findById(userId)

   //  console.log(user)
 
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
 
 
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })
 
    return {accessToken , refreshToken } 
  } catch (error) {
   throw new APIError(500, "Something went wrong while generating Access and Refresh Tokens.")
  }
}


// Register
const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


   const {username, fullname, email , password} = req.body
   console.log('email: ', email)

   if([fullname, username, email, password].some((field) => {
    field?.trim() === ""
   })){
    throw new APIError(400, "All fields are required for registration ")
   }
   const existedUser = await User.findOne({
    $or: [{username, email}]
   })

   if(existedUser){
    throw new APIError(409, "User already exist ")
   }

   const avatarLocalPath = await req.files?.avatar[0]?.path
   // console.log(req.files)

   let coverImageLocalPath;

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = await req.files?.coverImage[0]?.path

   }
   
   console.log(avatarLocalPath)
   if(!avatarLocalPath){
      throw new APIError(404, 'profile image is required')
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   // console.log(avatar)
   // console.log(coverImage)


   if(!avatar){
      throw new APIError(404 , "Profile image is required ")
   }

  


   const user = await User.create({
      fullname, 
      email,
      password,
      avatar: avatar.url, 
      coverImage: coverImage?.url || "",
      username : username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
      throw APIError(500, "Something went wrong while registering the user.")
   }

   return res.status(201).json(
       new APIResponse(200, createdUser, "User registered successfully.")
   )



})


// Login /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const loginUser = asyncHandler(async (req, res) => {
  try {
    const {username, email, password} = req.body;
   //  console.log(email , password)
 
    if(!username && !email){
       throw new APIError(401, "Invalid email or username ")
    }
    const user = await User.findOne({
       $or: [{username}, {email}]
    })

   //  console.log(user)
 
    if(!user) {
       throw new APIError(401, "user does not exist ")
    }
 
    const isPasswordCorrect = await user.isPasswordCorrect(password.toString())
 
    if(!isPasswordCorrect){
       throw new APIError(409,'user does not exist ')
    }

    console.log(user._id)
    
    const {accessToken, refreshToken} = await generateRefreshandAccessToken(user._id)
 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(loggedInUser)
 
    const options = {
       httpOnly: true ,
       secure: true 
    }
 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
       new APIResponse(
          200, 
          {
             user: loggedInUser, accessToken, refreshToken
          },
          "User logged in successfully"
       )
    )
  } catch (error) {
   throw new APIError(409, error);
  }
})

// Logout /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1 
         }
      },
      {
         new: true
      }
      
   )

   const options = {
      httpOnly: true,
      secure:  true
   }

   res.status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
      new APIResponse(200, {}, "Logged Out Successfully")
   )
})

// refresh-access ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const refreshAccessToken = asyncHandler(async(req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new APIError(401, "Invalid Refresh Token")
   }

   try {
      console.log('incomingRefreshToken-->', incomingRefreshToken)
      const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
      // console.log("decodedToken-->" ,decodedToken)
   
      const user = await User.findById(decodedToken?._id);
   
      if(!user){
         throw new APIError(401, "Invalid Refresh Token")
      }
      console.log("userRefreshToken-->", user?.refreshToken)
   
      if(incomingRefreshToken !== user?.refreshToken){
         throw new APIError(401, "Refresh token is used or expired")
      }
   
      const {accessToken, refreshToken} = await generateRefreshandAccessToken(user?._id)
      
      const options = [
      {
         httpOnly:true, 
         secure: true
      }
      ]

      console.log("newRefreshToken-->", refreshToken)
      return res.
      status(200).
      cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken , options )
      .json(
         new APIResponse(200,{accessToken , refreshToken}, "Successfully refreshed")
      )
   } catch (error) {
      throw new APIError(500, error?.message);
   }
}) 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const changeCurrentPassword = asyncHandler(async(req, res) => {
   const {oldPassword, newPassword} = req.body;

   const user = await User.findById(req.user?._id)

   if(!user){
      throw new APIError(401, "user is Invalid")
   }

   const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new APIError(401, "Invalid old password")
   }

   user.password = newPassword;
   user.save({validateBeforeSave: false})

   return res.status(200)
   .json(
      new APIResponse(200, {}, "Password changed successfully")
   )
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getCurrentUser = asyncHandler(async(req, res)=> {
   return res
   .status(200)
   .json(
      new APIResponse(201, req.user, "Current user fetched successfully")
   )
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateAccountDetails = asyncHandler(async(req, res) => {
   const {fullname, email} = req.body;

   if(!fullname || !email){
      throw APIError(401, "Both fields are required")
   }

   const user = await User.findByIdAndUpdate(req.body?._id, {
      $set:{
         fullname: fullname,
         email : email
      }
      
   },{new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new APIResponse(200, user, "Account details updated successfully")
   )
})


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateUserAvatar = asyncHandler(async(req, res) => {
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
      throw new APIError(401, "Avatar image not found ")
   }

   console.log(avatarLocalPath)

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if(!avatar){
      throw new APIError(401, "Error while uploading on avatar ")
   }

   // delete prev file
   // const publicId = avatar.public_id

   console.log(User.findById(req.user._id).avatar)

   const delResponse = await deleteFromCloudinary(User.findById(req.user._id).avatar)

   if(delResponse){
      throw new APIError(500, "Error Occured While deleting old avatar ")
   }
   const user = User.findByIdAndUpdate(req.user._id,
      {
         $set: {
            avatar: avatar.url
         }
      }, 
      {new:true}
      
      
      ).select("-password")

   

   return res
   .status(200)
   .json(
      new APIResponse(200, user, "Avatar updated successfully")
   )
}) 

// cover image update ////////////////////////////////////////////////////////////////////////////////////////////////////////////
const updateUserCoverImage = asyncHandler(async(req, res) => {
   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath){
      throw new APIError(401, "Avatar image not found ")
   }


   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!coverImage.url){
      throw new APIError(401, "Error while uploading on avatar ")
   }

   // delete prev file
   const publicId =  coverImage.public_id

   await deleteFromCloudinary(publicId)
   

const user = await User.findByIdAndUpdate(req.user._id,
   {
      $set: {
         coverImage: coverImage.url
      }
   }, 
   {new:true}
   
   
   ).select("-password")



return res
.status(200)
.json(
   new APIResponse(200, user, "Avatar updated successfully")
)
}) 

// CHANNELPROFILE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const getUserChannelProfile = asyncHandler(async(req, res) => {
   const {username} = req.params

   if(!username?.trim()){
      throw new APIError(400, "username is invalid ")
   }

   const channel = User.aggregate([
      {
         $match: {username: username?.toLowerCase()}
      },
      {
         $lookup: {
            from: "subscriptions", 
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         },
         $lookup: {
            from: "subscriptions", 
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
         
      },
       {
         $addFields: {
            subscriberCount: {
               $size: "$subscribers"
            },
            subscribedToCounts: {
               $size: "$subscribedTo"
            },
            isSubscribed: {
              $cond: {
               if: {$in: [req.user?._id, "$subscribers.subscriber"]},
               then: true,
               else: false
              }

            }

            
         }
       },
       {
         $project:{
            fullname: 1, 
            username: 1, 
            subscribedToCounts: 1, 
            subscriberCount: 1, 
            coverImage : 1, 
            avatar: 1, 
            isSubscribed: 1,
            email: 1
         }
       }

   ])

   if(!channel?.length){
      throw new APIError(400, "channel does not exist ")
   }

   return res.status(200)
   .json(new APIResponse(200, 
      channel[0], "user profile fetched successfully"
   ))
})


// WATCHHISTORY////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getWatchHistory = asyncHandler(async(req, res) => {
   const user = User.aggregate([
      {
         $match: {
            _id: mongoose.Types.ObjectId(req.user?._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory", 
            foreignField: "_id", 
            as: "watchHistory",

         pipeline:[
          { $lookup: {
               from : "users", 
               localField: "owner",
               foreignField: "_id",
               as: "owner", 
               pipeline: [
                     {
                        $project:{
                           fullname:1, 
                           username: 1, 
                           avatar: 1                           
                        }
                     }
               ]

            }
         },
         {
            $addFields: {
               $first: "$owner"
            }
         }
      ]
         }

      }

   ])

   return res
   .status(200)
   .json(
      new APIResponse(200, user[0].watchHistory, "user watch history fetched successfully")
   )

})




export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}