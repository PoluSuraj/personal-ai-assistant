import { DailyMessage } from "../models/dailyMessage.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.models.js";
import { sendLearningMessageMail } from "./mailsender.js";

const THOUGHTS = [
    "Small progress is still progress. Give one idea your attention today, and let curiosity do the rest.",
    "You do not need to know everything to begin. Every question you ask is a step toward understanding.",
    "A little practice, repeated with patience, can take you further than a perfect plan you never start.",
    "Mistakes are useful evidence. Notice what they teach you, adjust, and keep moving forward.",
    "Your pace is your own. Stay consistent, celebrate what you learn, and trust the work you are putting in.",
    "The next skill you build may begin with one small question. Make room for it today.",
    "Learning is not a race. Showing up with an open mind is already a meaningful achievement.",
];

const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
let lastSweepAt = 0;
let sweepRunning = false;

const localParts = (date) => Object.fromEntries(
    new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value])
);

const claimMessage = async (userId, dayKey, kind, message) => {
    try {
        return await DailyMessage.findOneAndUpdate(
            { userId, dayKey, kind },
            { $setOnInsert: { userId, dayKey, kind, message } },
            { upsert: true, new: true }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
        return DailyMessage.findOne({ userId, dayKey, kind });
    }
};

const deliver = async ({ user, dayKey, kind, subject, heading, message }) => {
    const dispatch = await claimMessage(user._id, dayKey, kind, message);
    if (!dispatch) return;
    const savedMessage = dispatch.message || message;

    if (!dispatch.notificationCreatedAt) {
        try {
            await Notification.create({
                title: heading,
                message: savedMessage,
                recipientEmail: user.email.toLowerCase(),
                audience: "user",
                type: "system",
                createdByEmail: "system@personal-ai-assistant",
                link: "/notifications",
                metadata: { kind, dayKey },
                dedupeKey: `${kind}:${user._id}:${dayKey}`,
            });
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
        dispatch.notificationCreatedAt = new Date();
        await dispatch.save();
    }

    const emailEnabled = user.preferences?.emailNotifications !== false && (
        kind !== "motivation" || user.preferences?.dailyMotivationEmails !== false
    );
    if (!emailEnabled || dispatch.emailSentAt) return;

    const now = Date.now();
    if (dispatch.lastEmailAttemptAt && now - dispatch.lastEmailAttemptAt.getTime() < 30 * 60 * 1000) return;

    dispatch.lastEmailAttemptAt = new Date(now);
    dispatch.lastError = "";
    await dispatch.save();

    try {
        const result = await sendLearningMessageMail({ to: user.email, name: user.name, subject, heading, message: savedMessage });
        if (result.sent) {
            dispatch.emailSentAt = new Date();
            await dispatch.save();
        }
    } catch (error) {
        dispatch.lastError = String(error.message || "Email delivery failed").slice(0, 500);
        await dispatch.save();
        console.error(`Scheduled ${kind} email failed for ${user.email}:`, error.message);
    }
};

export const runDailyLearningMessages = async () => {
    const now = Date.now();
    if (sweepRunning || now - lastSweepAt < 10 * 60 * 1000) return;

    const parts = localParts(new Date(now));
    if (`${parts.hour}:${parts.minute}` < "09:00") return;

    sweepRunning = true;
    lastSweepAt = now;
    try {
        const dayKey = `${parts.year}-${parts.month}-${parts.day}`;
        const users = await User.find()
            .select("name email dateOfBirth preferences")
            .lean();

        for (const user of users) {
            const thought = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
            await deliver({
                user,
                dayKey,
                kind: "motivation",
                subject: "A little learning inspiration for today",
                heading: "A thought for your learning journey",
                message: thought,
            });

            if (user.dateOfBirth?.slice(5) === `${parts.month}-${parts.day}`) {
                await deliver({
                    user,
                    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
                    kind: "birthday",
                    subject: "Happy birthday from Personal AI Assistant",
                    heading: `Happy birthday, ${(user.name || "Learner").split(" ")[0]}!`,
                    message: "Wishing you a joyful year full of curiosity, growth, and moments to be proud of. We are glad to be part of your learning journey.",
                });
            }
        }
    } catch (error) {
        console.error("Scheduled learner messages could not be processed:", error.message);
    } finally {
        sweepRunning = false;
    }
};
