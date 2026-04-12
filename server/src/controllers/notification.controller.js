import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.models.js";
import { getAdminEmails, isAdminUser } from "../middlewares/auth.middleware.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const createNotification = async ({
    title,
    message,
    recipientEmail = null,
    audience = "user",
    type = "system",
    createdByEmail = null,
    link = "",
    metadata = {},
}) => {
    return Notification.create({
        title,
        message,
        recipientEmail: recipientEmail ? normalizeEmail(recipientEmail) : null,
        audience,
        type,
        createdByEmail: createdByEmail ? normalizeEmail(createdByEmail) : null,
        link,
        metadata,
    });
};

export const notifyAdmins = async ({ title, message, type = "system", createdByEmail = null, link = "", metadata = {} }) => {
    const protectedAdmins = getAdminEmails();
    const dbAdmins = await User.find({ isAdmin: true }).select("email");
    const allAdminEmails = [...new Set([...protectedAdmins, ...dbAdmins.map((admin) => normalizeEmail(admin.email))])];
    return Promise.all(
        allAdminEmails.map((email) =>
            createNotification({
                title,
                message,
                recipientEmail: email,
                audience: "admin",
                type,
                createdByEmail,
                link,
                metadata,
            })
        )
    );
};

const listNotifications = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.user?.email);
    const admin = isAdminUser(req.user);
    const query = admin
        ? { $or: [{ recipientEmail: email }, { audience: "admin", recipientEmail: null }] }
        : { recipientEmail: email };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json(new ApiResponse(200, notifications, "Notifications loaded"));
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) throw new ApiError(404, "Notification not found");

    const email = normalizeEmail(req.user?.email);
    const allowed =
        notification.recipientEmail === email ||
        (isAdminUser(req.user) && notification.audience === "admin") ||
        (isAdminUser(req.user) && notification.audience === "broadcast");

    if (!allowed) throw new ApiError(403, "Not allowed to update this notification");

    notification.status = "read";
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

const sendDirectNotification = asyncHandler(async (req, res) => {
    const { recipientEmail, title, message, audience = "user", link = "/notifications" } = req.body;

    if (!recipientEmail || !title || !message) {
        throw new ApiError(400, "Recipient email, title, and message are required");
    }

    const normalizedRecipient = normalizeEmail(recipientEmail);
    const user = await User.findOne({ email: normalizedRecipient }).select("email name isAdmin");
    if (!user) {
        throw new ApiError(404, "User not found for the provided email");
    }

    const notification = await createNotification({
        title,
        message,
        recipientEmail: normalizedRecipient,
        audience: audience === "admin" ? "admin" : "user",
        type: "system",
        createdByEmail: req.user?.email,
        link,
        metadata: { target: normalizedRecipient },
    });

    return res.status(201).json(new ApiResponse(201, notification, "Notification sent successfully"));
});

const broadcastNotification = asyncHandler(async (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) throw new ApiError(400, "Title and message are required");

    const users = await User.find().select("email");
    const uniqueEmails = [...new Set(users.map((user) => normalizeEmail(user.email)).filter(Boolean))];
    const created = await Promise.all(
        uniqueEmails.map((email) =>
            createNotification({
                title,
                message,
                recipientEmail: email,
                audience: "broadcast",
                type: "broadcast",
                createdByEmail: req.user.email,
                link: "/notifications",
            })
        )
    );

    return res.status(201).json(new ApiResponse(201, { count: created.length }, "Broadcast delivered"));
});

export default {
    listNotifications,
    markNotificationRead,
    sendDirectNotification,
    broadcastNotification,
};
