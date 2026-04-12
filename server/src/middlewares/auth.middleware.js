import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { getDemoUserById, isDemoMode } from "../utils/demoStore.js";

export const getAdminEmails = () => [
    process.env.ADMIN_EMAIL,
    process.env.SUPPORT_EMAIL,
    "21a91a0547@gmail.com",
    "21a91a0547@aec.edu.in",
].filter(Boolean).map((email) => email.toLowerCase());

export const isAdminUser = (user) => {
    const userEmail = String(user?.email || "").toLowerCase();
    return Boolean(user?.isAdmin) || getAdminEmails().includes(userEmail);
};

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;
    if (!token) {
        throw new ApiError(401, "Unauthorized Access");
    }

    if (isDemoMode()) {
        if (token === "demo-access-token") {
            const demoUser = getDemoUserById(req.cookies?.demoUserId) || getDemoUserById("demo-user");
            if (demoUser) {
                req.user = { ...demoUser, isAdmin: isAdminUser(demoUser) };
                return next();
            }
        }
        throw new ApiError(401, "Invalid demo session");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid Access Token");
    }

    const payload = user.toObject();
    payload.isAdmin = isAdminUser(payload);
    req.user = payload;
    next();
});

export const requireAdmin = asyncHandler(async (req, res, next) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(403, "Admin access required");
    }
    next();
});
