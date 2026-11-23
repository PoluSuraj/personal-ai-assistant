import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        userEmail: { type: String, required: true, lowercase: true, index: true },
        kind: { type: String, enum: ["chat", "voice", "quiz"], required: true, index: true },
        prompt: { type: String, default: "", maxlength: 10000 },
        response: { type: String, default: "", maxlength: 50000 },
        topic: { type: String, default: "", maxlength: 300 },
        attemptId: { type: String, default: "" },
        questions: { type: [Schema.Types.Mixed], default: undefined },
        answers: { type: Schema.Types.Mixed, default: {} },
        score: { type: Number, default: null },
        total: { type: Number, default: null },
        percentage: { type: Number, default: null },
        autoSubmitReason: { type: String, default: "", maxlength: 500 },
    },
    { timestamps: true }
);

activitySchema.index({ userId: 1, kind: 1, createdAt: -1 });
activitySchema.index({ userId: 1, attemptId: 1 }, { unique: true, partialFilterExpression: { attemptId: { $gt: "" } } });

export const Activity = mongoose.model("Activity", activitySchema);
