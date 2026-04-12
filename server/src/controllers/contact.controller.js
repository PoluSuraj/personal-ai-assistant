import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendContactMail } from "../utils/mailsender.js";
import { Contact } from "../models/contact.model.js";
import { Subscription } from "../models/subscription.model.js";
import { createNotification, notifyAdmins } from "./notification.controller.js";

const sendContactMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        throw new ApiError(400, "Missing required fields: name, email, subject, message");
    }

    if (message.trim().length < 10) {
        throw new ApiError(400, "Message must be at least 10 characters long");
    }

    // Save contact message to database
    const contactMessage = await Contact.create({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
    });

    if (!contactMessage) {
        throw new ApiError(500, "Failed to save your message");
    }

    await createNotification({
        title: "We received your message",
        message: `Your query about "${subject.trim()}" has been received by our team.`,
        recipientEmail: email.trim(),
        audience: "user",
        type: "contact",
        link: "/notifications",
        metadata: { contactId: String(contactMessage._id) },
    });

    await notifyAdmins({
        title: "New contact message",
        message: `${name.trim()} sent a new message: ${subject.trim()}`,
        type: "contact",
        createdByEmail: email.trim(),
        link: "/admin/inbox",
        metadata: { contactId: String(contactMessage._id) },
    });

    // Send confirmation email to user (non-blocking)
    sendContactMail(email, name).catch((err) => {
        console.error("Failed to send confirmation email:", err.message);
    });

    console.log("📧 New contact message saved to database:", {
        id: contactMessage._id,
        name,
        email,
        subject,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            { submissionId: contactMessage._id },
            "Your message has been received. We will contact you shortly."
        )
    );
});

// Get all contact messages (admin only - optional)
const getAllContactMessages = asyncHandler(async (req, res) => {
    const messages = await Contact.find().sort({ createdAt: -1 });
    
    if (!messages) {
        throw new ApiError(404, "No contact messages found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            messages,
            `Found ${messages.length} contact messages`
        )
    );
});

// Get single contact message (admin only - optional)
const getContactMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await Contact.findById(id);
    
    if (!message) {
        throw new ApiError(404, "Contact message not found");
    }

    // Mark as read
    if (message.status === "new") {
        message.status = "read";
        await message.save();
    }

    return res.status(200).json(
        new ApiResponse(200, message, "Contact message retrieved")
    );
});

// Update contact message status and add reply (admin only - optional)
const updateContactMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reply } = req.body;

    if (!id) {
        throw new ApiError(400, "Message ID is required");
    }

    const message = await Contact.findById(id);
    
    if (!message) {
        throw new ApiError(404, "Contact message not found");
    }

    if (status) {
        message.status = status;
    }

    if (reply) {
        message.reply = reply;
        message.replyDate = new Date();
        await createNotification({
            title: `Reply to: ${message.subject}`,
            message: reply,
            recipientEmail: message.email,
            audience: "user",
            type: "reply",
            createdByEmail: req.user?.email,
            link: "/notifications",
            metadata: { contactId: String(message._id) },
        });
    }

    await message.save();

    return res.status(200).json(
        new ApiResponse(200, message, "Contact message updated successfully")
    );
});

const subscribeNewsletter = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        throw new ApiError(400, "Valid email is required");
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({ email: email.toLowerCase() });
    if (existingSubscription) {
        if (existingSubscription.isActive) {
            throw new ApiError(400, "You are already subscribed to our newsletter");
        } else {
            // Reactivate subscription
            existingSubscription.isActive = true;
            await existingSubscription.save();
            return res.status(200).json(
                new ApiResponse(200, { email }, "You have been reactivated! Welcome back.")
            );
        }
    }

    // Create new subscription
    const subscription = await Subscription.create({
        email: email.toLowerCase().trim(),
    });

    if (!subscription) {
        throw new ApiError(500, "Failed to subscribe");
    }

    console.log("✅ New newsletter subscriber:", email);

    return res.status(201).json(
        new ApiResponse(
            201,
            { email },
            "Thank you for subscribing! Check your email for updates."
        )
    );
});

export default {
    sendContactMessage,
    getAllContactMessages,
    getContactMessage,
    updateContactMessage,
    subscribeNewsletter,
};
