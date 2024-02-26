import {ApiResponse} from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ArtistUser } from "../models/ArtistUser.models.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    /**
     * Verifies the JWT token.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next function.
     * @returns {Promise<void>} - A promise that resolves when the JWT is verified.
     */
  
    try{
        // Get the access token from the cookies
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    // If there is no access token, return an error
    if (!accessToken) {
        throw new ApiError(
                401,
                "Access Token is required."
            )   
    }

    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    // Find the user by ID
    const artistUser = await ArtistUser.findById(decoded._id);

    // If the user does not exist, return an error
    if (!artistUser) {
        throw new ApiError(401, "User not found !!");
    }

    // Set the user in the request object
    req.user = artistUser.toJSON();
    next();
    } catch (error) {
        throw new ApiError(401, "Invalid Token !!");
    }

});
