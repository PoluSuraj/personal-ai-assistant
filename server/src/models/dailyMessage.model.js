import mongoose, { Schema } from "mongoose";

const dailyMessageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayKey: { type: String, required: true },
    kind: { type: String, enum: ["motivation", "birthday"], required: true },
    message: { type: String, default: "" },
    emailSentAt: { type: Date, default: null },
    notificationCreatedAt: { type: Date, default: null },
    lastEmailAttemptAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
}, { timestamps: true });

dailyMessageSchema.index({ userId: 1, dayKey: 1, kind: 1 }, { unique: true });

export const DailyMessage = mongoose.model("DailyMessage", dailyMessageSchema);
