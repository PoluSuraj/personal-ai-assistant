import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
import { accessTokenOptions, refreshTokenOptions } from "../constants.js"
import { sendAccountWelcomeMail, sendOtpMail } from "../utils/mailsender.js";
import { sendResetMail } from "../utils/mailsender.js";
import crypto from "crypto";
import { OtpSchema } from "../models/otp.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createDemoUser, ensureDemoUser, getDemoUserByEmail, isDemoMode, updateDemoUser, validateDemoLogin, verifyDemoOtp } from "../utils/demoStore.js";
import { getAdminEmails, isAdminUser } from "../middlewares/auth.middleware.js";
import { createNotification } from "./notification.controller.js";
import { Contact } from "../models/contact.model.js";
import { Notification } from "../models/notification.model.js";
import { Activity } from "../models/activity.model.js";
import { Subscription } from "../models/subscription.model.js";

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const isValidDateOfBirth = (value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
};

const makeTemporaryPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const special = "@$!%*?&";
    const all = uppercase + lowercase + digits + special;
    const pick = (characters) => characters[crypto.randomInt(characters.length)];
    const password = [pick(uppercase), pick(lowercase), pick(digits), pick(special), ...Array.from({ length: 16 }, () => pick(all))];
    for (let index = password.length - 1; index > 0; index -= 1) {
        const swapIndex = crypto.randomInt(index + 1);
        [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
    }
    return password.join("");
};

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
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    if (isDemoMode()) {
        try {
            const user = createDemoUser({ email: normalizedEmail, name, password });
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
    const emailExist = await User.findOne({ email: normalizedEmail });
    if (emailExist) {
        throw new ApiError(403, "Email already registered with other user");
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        isAdmin: getAdminEmails().includes(normalizedEmail),
    });

    if (!user) {
        throw new ApiError(500, "Error occurred while Registering user user");
    }
    const otp = crypto.randomInt(100000, 1000000);
    const otpDelivery = await sendOtpMail(normalizedEmail, otp).catch(err => {
        console.error("Failed to send OTP email:", err.message);
        return { sent: false };
    });
    if (!otpDelivery?.sent && process.env.NODE_ENV === "production") {
        await User.deleteOne({ _id: user._id });
        throw new ApiError(503, "We could not send a verification code to that email. Check the address and try again.");
    }
    await OtpSchema.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { otp: String(otp), expiresAt: new Date(Date.now() + OTP_LIFETIME_MS) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res
        .status(201)
        .json(new ApiResponse(201, { email: normalizedEmail, devOtp: otpDelivery?.sent ? undefined : String(otp) }, otpDelivery?.sent ? "OTP sent to email. Verify it to finish creating your account." : "Development OTP generated. Verify it to finish creating your account."));
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
        return res
            .status(200)
            .cookie("accessToken", "demo-access-token", accessTokenOptions)
            .cookie("refreshToken", "demo-refresh-token", refreshTokenOptions)
            .cookie("demoUserId", user._id, accessTokenOptions)
            .json(new ApiResponse(200, user, "Signed in successfully."));
    }

    // Find user by email or username
    const loginIdentity = String(emailOrUsername).trim();
    let user = await User.findOne({
        $or: [
            { email: loginIdentity.toLowerCase() },
            { username: loginIdentity.toLowerCase() }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not Found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(403, "Invalid credentials");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(403, "Verify your email address before signing in. Check your inbox for the verification code.");
    }

    if (user.mustChangePassword) {
        return res.status(200).json(new ApiResponse(200, {
            email: user.email,
            mustChangePassword: true,
        }, "Change your temporary password to continue"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const safeUser = await User.findById(user._id).select("-password -refreshToken");
    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, { ...safeUser.toObject(), isAdmin: isAdminUser(safeUser), accessToken, refreshToken }, "Signed in successfully."));
});


const registerWithGoogle = asyncHandler(async (req, res) => {
    throw new ApiError(501, "Google sign-up is unavailable until provider identity verification is configured. Use email verification instead.");
})

const loginWithGoogle = asyncHandler(async (req, res) => {
    throw new ApiError(501, "Google sign-in is unavailable until provider identity verification is configured. Use email and password instead.");
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

const completeInitialPassword = asyncHandler(async (req, res) => {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "Email and all password fields are required");
    }
    if (newPassword !== confirmPassword) throw new ApiError(400, "New passwords do not match");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        throw new ApiError(400, "Use at least 8 characters with uppercase, lowercase, a number, and a supported special character");
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !user.mustChangePassword) throw new ApiError(403, "This account does not require an initial password change");
    if (!(await user.isPasswordCorrect(currentPassword))) throw new ApiError(403, "Temporary password is incorrect");
    if (currentPassword === newPassword) throw new ApiError(400, "Choose a password different from the temporary password");

    user.password = newPassword;
    user.mustChangePassword = false;
    user.refreshToken = undefined;
    user.lastOtpVerifiedAt = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, { email: user.email }, "Password updated. Sign in with your new password."));
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


const removeAvatar = asyncHandler(async (req, res) => {
    if (isDemoMode()) {
        const user = updateDemoUser(req.user._id, { avatar: "" });
        if (!user) throw new ApiError(404, "Demo user not found");
        return res.status(200).json(new ApiResponse(200, user, "Profile photo removed"));
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { avatar: 1 },
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, { ...updatedUser.toObject(), isAdmin: isAdminUser(updatedUser) }, "Profile photo removed"));
});


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

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailExist = await OtpSchema.findOne({ email: normalizedEmail });
    if (!emailExist) {
        throw new ApiError(401, "Wrong credentials");
    }

    const expiresAt = emailExist.expiresAt || new Date(new Date(emailExist.createdAt).getTime() + OTP_LIFETIME_MS);
    if (expiresAt.getTime() <= Date.now()) {
        await OtpSchema.deleteOne({ _id: emailExist._id });
        throw new ApiError(401, "This verification code expired. Request a new code.");
    }

    if (!(otp === emailExist.otp)) {
        throw new ApiError(401, "Wrong OTP");
    }
    const user = await User.findOne({ email: normalizedEmail });
    await OtpSchema.findOneAndDelete({ email: normalizedEmail });
    if (!user) {
        throw new ApiError(404, "Something went wrong")
    }

    user.isEmailVerified = true;
    user.lastOtpVerifiedAt = new Date();
    await user.save({ validateBeforeSave: false });

    if (user.mustChangePassword) {
        return res.status(200).json(new ApiResponse(200, {
            email: user.email,
            mustChangePassword: true,
        }, "Verified Success"));
    }

    const safeUser = await User.findById(user._id).select('-password -refreshToken');

    // After OTP verification, issue tokens/cookies (completes login)
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, { ...safeUser.toObject(), isAdmin: isAdminUser(safeUser), accessToken, refreshToken }, "Verified Success"));


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
    const { name, email, username, bio, dateOfBirth, institutionName, institutionCountry, institutionType, preferences } = req.body;

    if (!name || !email) {
        throw new ApiError(400, "Name and Email are required");
    }

    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : username;

    if (isDemoMode()) {
        const user = updateDemoUser(req.user._id, {
            name,
            email,
            username: normalizedUsername || "",
            bio,
            dateOfBirth,
            institutionName,
            institutionCountry,
            institutionType,
            preferences,
        });
        if (!user) throw new ApiError(404, "Demo user not found");
        return res.status(200).json(new ApiResponse(200, user, "Demo account details updated successfully"));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (normalizedUsername) {
        const existingUsername = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user._id } }).select("_id");
        if (existingUsername) {
            throw new ApiError(409, "Username is already taken");
        }
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    user.username = normalizedUsername || undefined;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth !== undefined) {
        if (!isValidDateOfBirth(dateOfBirth)) throw new ApiError(400, "Enter a valid date of birth that is not in the future");
        user.dateOfBirth = dateOfBirth;
    }
    if (institutionName !== undefined) user.institutionName = String(institutionName).trim().slice(0, 160);
    if (institutionCountry !== undefined) user.institutionCountry = String(institutionCountry).trim().slice(0, 100);
    if (institutionType !== undefined) {
        if (!["", "school", "college", "other"].includes(institutionType)) throw new ApiError(400, "Choose a valid institution type");
        user.institutionType = institutionType;
    }

    if (preferences && typeof preferences === "object") {
        user.preferences = {
            emailNotifications: preferences.emailNotifications ?? user.preferences?.emailNotifications ?? true,
            twoFactorAuth: preferences.twoFactorAuth ?? user.preferences?.twoFactorAuth ?? false,
            adaptivePractice: preferences.adaptivePractice ?? user.preferences?.adaptivePractice ?? true,
            dailyMotivationEmails: preferences.dailyMotivationEmails ?? user.preferences?.dailyMotivationEmails ?? true,
            applicationLanguage: preferences.applicationLanguage ?? user.preferences?.applicationLanguage ?? "en-US",
        };
    }

    await user.save({ validateBeforeSave: false });

    const safeUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, { ...safeUser.toObject(), isAdmin: isAdminUser(safeUser) }, "Account details updated successfully"));
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

    const users = await User.find().select("name email username bio avatar dateOfBirth institutionName institutionCountry institutionType preferences isAdmin createdAt updatedAt").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, users, "Users loaded"));
});

const getManagedUserDetails = asyncHandler(async (req, res) => {
    const email = decodeURIComponent(req.params.email || "").trim().toLowerCase();
    if (!email) throw new ApiError(400, "User email is required");

    const user = await User.findOne({ email }).select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");

    const [notifications, contacts, activities, activityCounts, notificationCount, unreadNotificationCount, contactCount, repliedContactCount, subscription] = await Promise.all([
        Notification.find({ recipientEmail: email }).sort({ createdAt: -1 }).limit(100).lean(),
        Contact.find({ email }).sort({ createdAt: -1 }).limit(100).lean(),
        Activity.find({ userId: user._id }).sort({ createdAt: -1, _id: -1 }).limit(101).lean(),
        Activity.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: "$kind", count: { $sum: 1 } } },
        ]),
        Notification.countDocuments({ recipientEmail: email }),
        Notification.countDocuments({ recipientEmail: email, status: { $ne: "read" } }),
        Contact.countDocuments({ email }),
        Contact.countDocuments({ email, status: "replied" }),
        Subscription.findOne({ email }).select("isActive subscribedAt createdAt updatedAt").lean(),
    ]);
    const counts = Object.fromEntries(activityCounts.map(({ _id, count }) => [_id, count]));
    const activitiesHaveMore = activities.length > 100;
    const visibleActivities = activities.slice(0, 100);
    const lastVisibleActivity = visibleActivities.at(-1);

    return res.status(200).json(new ApiResponse(200, {
        user: { ...user.toObject(), isAdmin: isAdminUser(user) },
        notifications,
        contacts,
        activities: visibleActivities,
        activitiesHaveMore,
        activitiesNextCursor: activitiesHaveMore && lastVisibleActivity
            ? JSON.stringify({ createdAt: lastVisibleActivity.createdAt, id: lastVisibleActivity._id })
            : null,
        subscription,
        stats: {
            notifications: notificationCount,
            unreadNotifications: unreadNotificationCount,
            contactMessages: contactCount,
            repliedContacts: repliedContactCount,
            chats: counts.chat || 0,
            voiceSessions: counts.voice || 0,
            quizzes: counts.quiz || 0,
            subscription: subscription ? (subscription.isActive ? "active" : "unsubscribed") : "not subscribed",
        },
        availability: {
            chatHistory: true,
            note: "Recent chat and voice transcripts, quiz answers, scores, contacts, and notifications are stored for the account and visible to authorized administrators. Passwords and authentication tokens are never included.",
        },
    }, "User details loaded"));
});

const getManagedUserActivities = asyncHandler(async (req, res) => {
    const email = decodeURIComponent(req.params.email || "").trim().toLowerCase();
    if (!email) throw new ApiError(400, "User email is required");
    const user = await User.findOne({ email }).select("_id");
    if (!user) throw new ApiError(404, "User not found");

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = { userId: user._id };
    if (req.query.cursor) {
        let cursor;
        try {
            cursor = JSON.parse(req.query.cursor);
        } catch {
            throw new ApiError(400, "Invalid activity cursor");
        }
        const cursorDate = new Date(cursor.createdAt);
        if (!Number.isFinite(cursorDate.getTime()) || !/^[a-f\\d]{24}$/i.test(cursor.id || "")) {
            throw new ApiError(400, "Invalid activity cursor");
        }
        filter.$or = [
            { createdAt: { $lt: cursorDate } },
            { createdAt: cursorDate, _id: { $lt: cursor.id } },
        ];
    }
    const records = await Activity.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
    const hasMore = records.length > limit;
    const items = records.slice(0, limit);
    const last = items.at(-1);
    return res.status(200).json(new ApiResponse(200, {
        items,
        hasMore,
        nextCursor: hasMore && last ? JSON.stringify({ createdAt: last.createdAt, id: last._id }) : null,
    }, "User activity loaded"));
});

const updateManagedUser = asyncHandler(async (req, res) => {
    const email = decodeURIComponent(req.params.email || "").trim().toLowerCase();
    const { name, username, bio, dateOfBirth, institutionName, institutionCountry, institutionType, preferences } = req.body;
    if (!email) throw new ApiError(400, "User email is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");
    if (name !== undefined) {
        const normalizedName = String(name).trim();
        if (!normalizedName || normalizedName.length > 100) throw new ApiError(400, "Name must be between 1 and 100 characters");
        user.name = normalizedName;
    }
    if (username !== undefined) {
        const normalizedUsername = String(username).trim().toLowerCase();
        if (normalizedUsername && !/^[a-z0-9_.-]{3,30}$/.test(normalizedUsername)) {
            throw new ApiError(400, "Username must be 3-30 characters using letters, numbers, dots, underscores, or hyphens");
        }
        user.username = normalizedUsername || undefined;
    }
    if (bio !== undefined) {
        if (String(bio).length > 500) throw new ApiError(400, "Bio must be 500 characters or fewer");
        user.bio = String(bio).trim();
    }
    if (dateOfBirth !== undefined) {
        if (!isValidDateOfBirth(dateOfBirth)) throw new ApiError(400, "Enter a valid date of birth that is not in the future");
        user.dateOfBirth = dateOfBirth;
    }
    if (institutionName !== undefined) user.institutionName = String(institutionName).trim().slice(0, 160);
    if (institutionCountry !== undefined) user.institutionCountry = String(institutionCountry).trim().slice(0, 100);
    if (institutionType !== undefined) {
        if (!["", "school", "college", "other"].includes(institutionType)) throw new ApiError(400, "Choose a valid institution type");
        user.institutionType = institutionType;
    }
    if (preferences && typeof preferences === "object") {
        for (const key of ["emailNotifications", "adaptivePractice", "dailyMotivationEmails"]) {
            if (typeof preferences[key] === "boolean") user.preferences[key] = preferences[key];
        }
        if (typeof preferences.applicationLanguage === "string" && preferences.applicationLanguage.length <= 16) {
            user.preferences.applicationLanguage = preferences.applicationLanguage;
        }
    }
    await user.save();
    const safeUser = await User.findById(user._id).select("name email username bio avatar dateOfBirth institutionName institutionCountry institutionType preferences isAdmin isEmailVerified createdAt updatedAt");
    return res.status(200).json(new ApiResponse(200, { ...safeUser.toObject(), isAdmin: isAdminUser(safeUser) }, "User profile updated"));
});

const createUserManually = asyncHandler(async (req, res) => {
    const { name, email, isAdmin = false } = req.body;
    if (!name || !email) throw new ApiError(400, "Name and email are required");

    const normalizedEmail = String(email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new ApiError(400, "Enter a valid email address");
    if (isDemoMode()) {
        return res.status(201).json(new ApiResponse(201, { name, email: normalizedEmail, isAdmin }, "Demo user created"));
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw new ApiError(400, "User already exists");

    const temporaryPassword = makeTemporaryPassword();
    const user = await User.create({
        name,
        email: normalizedEmail,
        password: temporaryPassword,
        mustChangePassword: true,
        isEmailVerified: true,
        isAdmin: Boolean(isAdmin),
    });

    try {
        const delivery = await sendAccountWelcomeMail(user.email, user.name, temporaryPassword, user.isAdmin);
        if (!delivery.sent) throw new Error("Email delivery is not configured");
    } catch (error) {
        await user.deleteOne();
        console.error("Could not deliver account setup email:", error.message);
        throw new ApiError(503, "User was not created because the setup email could not be sent. Check the mail configuration and try again.");
    }

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
    completeInitialPassword,
    getCurrentUser,
    updateAvatar,
    removeAvatar,
    verifyOtp,
    forgotPassword,
    resetPassword,
    updateAccountDetails,
    listAdmins,
    grantAdminAccess,
    revokeAdminAccess,
    listUsers,
    getManagedUserDetails,
    getManagedUserActivities,
    updateManagedUser,
    createUserManually,
    removeUserManually
}
