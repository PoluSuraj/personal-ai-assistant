import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
        index: true
    },
    question: {
        type: String,
        required: true
    },
    options: {
        type: Map,
        of: String,
        required: true
    },
    correct: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Question = mongoose.model("Question", questionSchema);
