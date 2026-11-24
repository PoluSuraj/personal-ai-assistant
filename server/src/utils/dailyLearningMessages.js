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

const MAXIM_SUBJECTS = [
    "A patient learner", "The diligent student", "A curious mind", "The steady scholar",
    "A thoughtful reader", "The apprentice of any craft", "A seeker of understanding",
    "The careful observer", "One who practises daily", "A humble student",
    "The keeper of good habits", "A brave beginner", "An open mind", "The wise learner",
    "A quiet hour of study", "The earnest questioner", "A persevering scholar", "The attentive hand",
];

const MAXIM_ACTIONS = [
    "makes a lantern of each question", "turns small practice into lasting skill",
    "gathers strength from every careful attempt", "builds a sure path one lesson at a time",
    "finds a door where haste sees only a wall", "makes honest use of every mistake",
    "lays a firm stone with each page read", "keeps a bright fire by tending it daily",
    "draws nearer to mastery with patient work", "finds that wonder is a faithful guide",
    "makes good judgment from knowledge well tested", "carries a little learning into great work",
    "turns attention into a lasting companion", "discovers that courage grows by being used",
    "makes the plainest lesson a worthy teacher", "gives each new idea room to take root",
    "gains a sure footing by beginning humbly", "keeps the mind nimble through steady inquiry",
    "makes time serve the work that matters", "finds a rich harvest in faithful effort",
];

const MAXIM_LESSONS = [
    "patient effort outlives sudden zeal", "the slow road often carries the surest traveller",
    "wisdom is gathered one thoughtful page at a time", "a sound question is the beginning of an answer",
    "what is practised with care is seldom lost", "small beginnings have often borne fine fruit",
    "the mind grows by what it willingly examines", "diligence lends strength to natural talent",
    "a mistake observed is a lesson reclaimed", "steady hands finish what eager hearts begin",
    "the best time to learn is the hour one has", "a little progress faithfully kept becomes a great store",
    "good counsel is worth more when put to work", "the seed of mastery is humble repetition",
    "one clear thought can brighten a difficult day", "patience gives understanding room to ripen",
    "the learner who returns each day goes far", "careful work is a quiet form of courage",
    "an attentive mind is never wholly idle", "knowledge kept in use becomes sound judgment",
];

const hashText = (text) => {
    let hash = 2166136261;
    for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return hash >>> 0;
};

const composedMaximCount = MAXIM_SUBJECTS.length * MAXIM_ACTIONS.length * MAXIM_LESSONS.length;

const composedMaxim = (index) => {
    const lessonIndex = index % MAXIM_LESSONS.length;
    const actionIndex = Math.floor(index / MAXIM_LESSONS.length) % MAXIM_ACTIONS.length;
    const subjectIndex = Math.floor(index / (MAXIM_LESSONS.length * MAXIM_ACTIONS.length));
    return `${MAXIM_SUBJECTS[subjectIndex]} ${MAXIM_ACTIONS[actionIndex]}, for ${MAXIM_LESSONS[lessonIndex]}.`;
};

export const selectFreshThought = ({ previousMessages, userId, dayKey }) => {
    const used = new Set(previousMessages);
    const availableThoughts = THOUGHTS.filter((thought) => !used.has(thought));
    if (availableThoughts.length) {
        return availableThoughts[hashText(`${userId}:${dayKey}`) % availableThoughts.length];
    }

    const start = hashText(`${userId}:${dayKey}`) % composedMaximCount;
    for (let offset = 0; offset < composedMaximCount; offset += 1) {
        const thought = composedMaxim((start + offset) % composedMaximCount);
        if (!used.has(thought)) return thought;
    }

    throw new Error(`The unique daily maxim catalogue is exhausted for user ${userId}`);
};

const chooseUnusedThought = async (userId, dayKey) => {
    const existing = await DailyMessage.findOne({ userId, dayKey, kind: "motivation" }).select("message").lean();
    if (existing?.message) return existing.message;

    const previousMessages = await DailyMessage.distinct("message", { userId, kind: "motivation" });
    return selectFreshThought({ previousMessages, userId, dayKey });
};

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
            const thought = await chooseUnusedThought(user._id, dayKey);
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
