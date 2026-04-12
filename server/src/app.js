import express from "express";
import errorHandler from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import chatRouter from "./routes/aichat.routes.js";
import youtubeRouter from "./routes/youtube.routes.js";
import wikipediaRouter from "./routes/wikipedia.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();

const localOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];

const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || "").split(",").map((origin) => origin.trim()),
].filter(Boolean);

const allowedOrigins = [...new Set([...localOrigins, ...configuredOrigins])];
const allowAllOrigins = String(process.env.ALLOW_ALL_ORIGINS || "false").toLowerCase() === "true";

const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowAllOrigins || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
};

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.get("/", (req, res) => {
    res.json({ success: true, message: "Backend is working", mode: process.env.DEMO_MODE === "true" ? "demo" : "database" });
});

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        status: "ok",
        mode: process.env.DEMO_MODE === "true" ? "demo" : "database",
        cors: allowAllOrigins ? "allow-all" : allowedOrigins,
        services: {
            database: process.env.DEMO_MODE === "true" ? "demo-memory" : "mongodb",
            ai: process.env.GROQ_API_KEY && process.env.AI_API_URL ? "configured" : "fallback",
            aiModel: process.env.AI_MODEL || "llama-3.3-70b-versatile",
            youtube: process.env.YOUTUBE_API_KEY ? "configured" : "fallback",
            email: process.env.MAIL_ID && process.env.MAIL_PASSWORD ? "configured" : "fallback",
            cloudinary: process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET ? "configured" : "missing",
            auth: process.env.ACCESS_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET ? "configured" : "fallback",
        },
        demo: process.env.DEMO_MODE === "true"
            ? {
                  email: "demo@local.test",
                  password: "Password@123",
                  otp: "123456",
              }
            : null,
    });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/youtube", youtubeRouter);
app.use("/api/v1/wikipedia", wikipediaRouter);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/notifications", notificationRouter);

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;
