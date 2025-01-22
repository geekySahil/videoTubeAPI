import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {APIError} from '../utils/APIError.js'

export const verifyJWT = asyncHandler(async(req, res, next) => {
  try {
     const token = await req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  
     if(!token){
      throw new APIError(401, "Unauthorised request ")
     }
  
     const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
     
  
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
     if(!user){
      throw new APIError(404, "Invalid access token")
     }
  
     req.user = user ;
     next();
  } catch (error) {
        throw new APIError(404, error?.message);
  }

})