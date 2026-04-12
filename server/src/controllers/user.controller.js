import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
import { accessTokenOptions, refreshTokenOptions } from "../constants.js"
import { sendOtpMail } from "../utils/mailsender.js";
import { sendResetMail } from "../utils/mailsender.js";
import crypto from "crypto";
import { OtpSchema } from "../models/otp.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createDemoUser, ensureDemoUser, getDemoUserByEmail, isDemoMode, updateDemoUser, validateDemoLogin, verifyDemoOtp } from "../utils/demoStore.js";
import { getAdminEmails, isAdminUser } from "../middlewares/auth.middleware.js";
import { createNotification } from "./notification.controller.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh token" + error
        );
    }
};


const registerUser = asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !password || !name) {
        throw new ApiError(404, "Missing Credentials");
    }

    if (isDemoMode()) {
        try {
            const user = createDemoUser({ email, name, password });
            return res
                .status(201)
                .cookie("accessToken", "demo-access-token", accessTokenOptions)
                .cookie("refreshToken", "demo-refresh-token", refreshTokenOptions)
                .cookie("demoUserId", user._id, accessTokenOptions)
                .json(new ApiResponse(201, { ...user, demoOtp: "123456" }, "Demo user created. Use OTP 123456."));
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    }
    const emailExist = await User.findOne({ email });
    if (emailExist) {
        throw new ApiError(403, "Email already registered with other user");
    }

    const user = await User.create({
        name,
        email,
        password,
        isAdmin: getAdminEmails().includes(String(email).toLowerCase()),
    });

    if (!user) {
        throw new ApiError(500, "Error occurred while Registering user user");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const finalUser = await User.findById(user._id)
        .select("email isAdmin")



    // res.send(201).json(new ApiResponse(201,{},"Otp Sent"))
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Send OTP email (non-blocking, won't crash if email fails)
    const otpDelivery = await sendOtpMail(email, otp).catch(err => {
        console.error("Failed to send OTP email:", err.message);
        return { sent: false, otp: String(otp) };
    });

    const otpData = await OtpSchema.create({
        email,
        otp: String(otp),
    })

    if (!otpData) {
        throw new ApiError(300, "Error creation of otp")
    }




    return res
        .status(201)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(201, { ...finalUser.toObject(), isAdmin: isAdminUser(finalUser), devOtp: otpDelivery?.sent ? undefined : String(otp) }, otpDelivery?.sent ? "OTP sent to email" : "OTP generated. Email is not configured, use the shown OTP."));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email: emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
        throw new ApiError(404, "Email/Username and Password are required");
    }

    if (isDemoMode()) {
        ensureDemoUser();
        const user = validateDemoLogin({ email: emailOrUsername, password });
        if (!user) throw new ApiError(403, "Invalid demo credentials. Try demo@local.test / Password@123");
        return res.status(200).json(new ApiResponse(200, { email: user.email, demoOtp: "123456" }, "Demo OTP generated. Use 123456."));
    }

    // Find user by email or username
    let user = await User.findOne({
        $or: [
            { email: emailOrUsername },
            { username: emailOrUsername }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not Found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(403, "Invalid credentials");
    }

    // Login step 1: password verified -> send OTP to email (do not issue tokens yet)
    const otp = Math.floor(100000 + Math.random() * 900000);
    await OtpSchema.findOneAndUpdate(
        { email: user.email },
        { $set: { otp: String(otp) } },
        { upsert: true, new: true }
    );
    const otpDelivery = await sendOtpMail(user.email, otp).catch((err) => {
        console.error("Failed to send login OTP email:", err.message);
        return { sent: false, otp: String(otp) };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { email: user.email, devOtp: otpDelivery?.sent ? undefined : String(otp) }, otpDelivery?.sent ? "OTP sent to email. Verify OTP to complete login." : "OTP generated. Email is not configured, use the shown OTP."));
});


const registerWithGoogle = asyncHandler(async (req, res) => {

    const { name, email, avatar, password } = req.body;

    if (!email || !password || !name || !password) {
        throw new ApiError(404, "Missing Credentials");
    }
    const emailExist = await User.findOne({ email });
    if (emailExist) {
        throw new ApiError(403, "Email already registered with other user");
    }

    const user = await User.create({
        name,
        email,
        password,
        avatar,
        isEmailVerified: true,
        isAdmin: getAdminEmails().includes(String(email).toLowerCase())

    });
    if (!user) {
        throw new ApiError(500, "Error occurred while Registering user user");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const finalUser = await User.findById(user._id)
        .select("-password -refreshToken")

    return res
        .status(201)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(201, { ...finalUser.toObject(), isAdmin: isAdminUser(finalUser) }, "User creation Success"));


})

const loginWithGoogle = asyncHandler(async (req, res) => {

    const { email } = req.body;
    console.log(email)

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    let finalUser = await User.findById(user._id)
        .select("-password -refreshToken")

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, { ...finalUser.toObject(), isAdmin: isAdminUser(finalUser) }, "User Login Success"));


})


const logoutUser = asyncHandler(async (req, res) => {
    if (isDemoMode()) {
        return res
            .status(202)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("demoUserId")
            .json(new ApiResponse(202, {}, "Demo user logged out"));
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(202)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(202, {}, "User logged out"));
});

const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(404, "Missing Credentials");
    }
    if (newPassword !== confirmPassword) {
        throw new ApiError(406, "password didn't matched");
    }
    const user = await User.findById(req.user._id);
    const isCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isCorrect) {
        throw new ApiError(401, "Password Incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(201, {}, "Password updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, { ...req.user, isAdmin: isAdminUser(req.user) }, "Demo user loaded"));
    }

    const user = await User.findById(req.user._id)
        .select('-password -refreshToken');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { ...user.toObject(), isAdmin: isAdminUser(user) }, "Success")
        );
});



const updateAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    let avatar = user.avatar;
    if (!req.file) {
        throw new ApiError(404, "Avatar file not found")
    }

    const avatarBuffer = req.file.buffer.toString("base64")
    const uploadResponse = await uploadOnCloudinary(avatarBuffer)

    if (!uploadResponse?.secure_url) {
        throw new ApiError(404, "Error uploading avatar to cloudinary")
    }
    avatar = uploadResponse.secure_url

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar,
            },
        },
        {
            new: true,
        }
    )
        .select("-password -refreshToken")

    if (!updatedUser) {
        throw new ApiError(500, "Error occurred while updating avatar")

    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar details updated"));
})


const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email) {
        throw new ApiError(404, "Missing Credentials")
    }

    if (isDemoMode()) {
        const user = verifyDemoOtp({ email, otp });
        if (!user) throw new ApiError(401, "Wrong OTP. In demo mode use 123456.");
        return res
            .status(200)
            .cookie("accessToken", "demo-access-token", accessTokenOptions)
            .cookie("refreshToken", "demo-refresh-token", refreshTokenOptions)
            .cookie("demoUserId", user._id, accessTokenOptions)
            .json(new ApiResponse(200, { ...user, isAdmin: isAdminUser(user) }, "Verified Success"));
    }

    const emailExist = await OtpSchema.findOne({ email });
    if (!emailExist) {
        throw new ApiError(401, "Wrong credentials");
    }

    if (!(otp === emailExist.otp)) {
        throw new ApiError(401, "Wrong OTP");
    }
    const user = await User.findOne({ email }).select('-password -refreshToken');
    await OtpSchema.findOneAndDelete({ email });
    if (!user) {
        throw new ApiError(404, "Something went wrong")
    }

    // After OTP verification, issue tokens/cookies (completes login)
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, { ...user.toObject(), isAdmin: isAdminUser(user) }, "Verified Success"));


})


const forgotPassword = asyncHandler(async (req, res) => {
    const { email, userId } = req.body;

    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, { demoResetToken: "demo-reset-token" }, "Demo reset token generated."));
    }
    
    if (!email && !userId) {
        throw new ApiError(404, "Email or User ID is required");
    }

    let user;
    
    if (email) {
        user = await User.findOne({ email });
    } else if (userId) {
        user = await User.findById(userId);
    }

    if (!user) {
        // Don't reveal whether email/userId exists for security
        return res.status(200).json(new ApiResponse(200, {}, "If the account exists, reset instructions have been sent."));
    }

    const token = crypto.randomBytes(32).toString('hex');
    await OtpSchema.findOneAndUpdate(
        { email: user.email },
        { $set: { otp: token } },
        { upsert: true, new: true }
    );

    // Send reset email (non-blocking)
    sendResetMail(user.email, token).catch(err => {
        console.error('Failed to send reset email:', err.message);
    });

    return res.status(200).json(new ApiResponse(200, {}, "If the account exists, reset instructions have been sent."));
});


const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new ApiError(404, "Missing Credentials");
    }

    if (isDemoMode()) {
        const demoUser = getDemoUserByEmail("demo@local.test") || ensureDemoUser();
        updateDemoUser(demoUser._id, { password: newPassword });
        return res.status(200).json(new ApiResponse(200, {}, "Demo password has been reset."));
    }

    const tokenDoc = await OtpSchema.findOne({ otp: token });
    if (!tokenDoc) {
        throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findOne({ email: tokenDoc.email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    await OtpSchema.findOneAndDelete({ otp: token });

    return res.status(200).json(new ApiResponse(200, {}, "Password has been reset successfully."));
});



const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, username, bio } = req.body;

    if (!name || !email) {
        throw new ApiError(400, "Name and Email are required");
    }

    if (isDemoMode()) {
        const user = updateDemoUser(req.user._id, { name, email, username, bio });
        if (!user) throw new ApiError(404, "Demo user not found");
        return res.status(200).json(new ApiResponse(200, user, "Demo account details updated successfully"));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update fields
    user.name = name;
    user.email = email;

    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, { ...user.toObject(), isAdmin: isAdminUser(user) }, "Account details updated successfully"));
});

const listAdmins = asyncHandler(async (req, res) => {
    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, [{ email: req.user.email, name: req.user.name, isAdmin: true }], "Demo admin list"));
    }

    const admins = await User.find({
        $or: [
            { isAdmin: true },
            { email: { $in: getAdminEmails() } },
        ],
    }).select("name email isAdmin createdAt").sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, admins, "Admin users loaded"));
});

const grantAdminAccess = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Admin email is required");

    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, { email, isAdmin: true }, "Demo admin access granted"));
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) throw new ApiError(404, "User not found. Ask them to create an account first.");

    user.isAdmin = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, { name: user.name, email: user.email, isAdmin: true }, "Admin access granted"));
});

const revokeAdminAccess = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Admin email is required");

    const normalizedEmail = String(email).toLowerCase();
    if (getAdminEmails().includes(normalizedEmail)) {
        throw new ApiError(400, "This admin is protected by environment configuration");
    }

    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, { email, isAdmin: false }, "Demo admin access revoked"));
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, "User not found");

    user.isAdmin = false;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, { name: user.name, email: user.email, isAdmin: false }, "Admin access revoked"));
});


const listUsers = asyncHandler(async (req, res) => {
    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, [{ email: req.user.email, name: req.user.name, isAdmin: true }], "Demo users loaded"));
    }

    const users = await User.find().select("name email isAdmin createdAt").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, users, "Users loaded"));
});

const createUserManually = asyncHandler(async (req, res) => {
    const { name, email, password, isAdmin = false } = req.body;
    if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required");

    const normalizedEmail = String(email).toLowerCase();
    if (isDemoMode()) {
        return res.status(201).json(new ApiResponse(201, { name, email: normalizedEmail, isAdmin }, "Demo user created"));
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw new ApiError(400, "User already exists");

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        isEmailVerified: true,
        isAdmin: Boolean(isAdmin),
    });

    await createNotification({
        title: "Welcome to Personal AI Assistant",
        message: `Your account has been created by an administrator.${isAdmin ? " You also have admin access." : ""}`,
        recipientEmail: normalizedEmail,
        audience: "user",
        type: "system",
        createdByEmail: req.user.email,
        link: "/notifications",
    });

    return res.status(201).json(new ApiResponse(201, { name: user.name, email: user.email, isAdmin: user.isAdmin }, "User created manually"));
});

const removeUserManually = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");
    const normalizedEmail = String(email).toLowerCase();

    if (getAdminEmails().includes(normalizedEmail)) {
        throw new ApiError(400, "Protected administrator cannot be removed");
    }

    if (isDemoMode()) {
        return res.status(200).json(new ApiResponse(200, { email: normalizedEmail }, "Demo user removed"));
    }

    const user = await User.findOneAndDelete({ email: normalizedEmail });
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { email: normalizedEmail }, "User removed"));
});

export default {
    registerUser,
    registerWithGoogle,
    loginUser,
    loginWithGoogle,
    logoutUser,
    changeUserPassword,
    getCurrentUser,
    updateAvatar,
    verifyOtp,
    forgotPassword,
    resetPassword,
    updateAccountDetails,
    listAdmins,
    grantAdminAccess,
    revokeAdminAccess,
    listUsers,
    createUserManually,
    removeUserManually
}