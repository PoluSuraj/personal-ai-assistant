import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        username: {
            type: String,
            unique: true,
            sparse: true, // Allows nulls if not set initially
            trim: true,
            lowercase: true,
        },
        bio: {
            type: String,
            default: "",
        },
        dateOfBirth: {
            type: String,
            default: "",
            match: [/^$|^\d{4}-\d{2}-\d{2}$/, "Date of birth must use YYYY-MM-DD"],
        },
        institutionName: {
            type: String,
            default: "",
            trim: true,
            maxlength: 160,
        },
        institutionCountry: {
            type: String,
            default: "",
            trim: true,
            maxlength: 100,
        },
        institutionType: {
            type: String,
            enum: ["", "school", "college", "other"],
            default: "",
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        mustChangePassword: {
            type: Boolean,
            default: false,
        },
        avatar: {
            type: String,
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        lastOtpVerifiedAt: {
            type: Date,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        preferences: {
            emailNotifications: {
                type: Boolean,
                default: true,
            },
            twoFactorAuth: {
                type: Boolean,
                default: false,
            },
            adaptivePractice: {
                type: Boolean,
                default: true,
            },
            dailyMotivationEmails: {
                type: Boolean,
                default: true,
            },
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});



userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    // syntax
    return jwt.sign(
        {
            // this is the payload
            _id: this._id,
            email: this.email,
            name: this.name,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            // this is the payload
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
