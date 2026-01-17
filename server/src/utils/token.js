import { ApiError } from "./apiError.js"
import  Users from "../models/user.model.js"

export const generateAccessToken=async(userId)=>{
    try {
        
        const user = await Users.findById(userId);
        
        const accessToken = user.generateAccessToken();
        return {accessToken}

    } catch (error) {
        throw new ApiError(500,`Something went wrong while generating the token: ${error.message}`)
    }
}