import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
import { APIError } from './APIError.js';


const deleteFromCloudinary = async(url, resourceType = "image") => {

    const publicId = extractPublicId(url)
    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return response ;
    } catch (error) {
      throw new APIError(500, "Error While Deleting the file from cloudinary")
      return null;
    }
}

export default deleteFromCloudinary