import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        recipientEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
            index: true,
        },
        audience: {
            type: String,
            enum: ["user", "admin", "broadcast"],
            default: "user",
            index: true,
        },
        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
        },
        type: {
            type: String,
            enum: ["contact", "reply", "broadcast", "system"],
            default: "system",
        },
        createdByEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
        },
        link: {
            type: String,
            default: "",
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
