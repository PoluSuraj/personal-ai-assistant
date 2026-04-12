import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["new", "read", "replied"],
            default: "new",
        },
        reply: {
            type: String,
            default: "",
        },
        replyDate: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
