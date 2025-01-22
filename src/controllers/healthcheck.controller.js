import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";

const heathCheck = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(new APIResponse(200, {}, "Everything is Ok"))
})

export default heathCheck