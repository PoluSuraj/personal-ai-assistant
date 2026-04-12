import crypto from "crypto";

export const isDemoMode = () => process.env.DEMO_MODE === "true";

const users = new Map();
const otps = new Map();

const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
};

export const getDemoUserByEmail = (email) => users.get(String(email || "").toLowerCase());

export const getDemoUserById = (id) => [...users.values()].find((user) => user._id === id);

export const createDemoUser = ({ name, email, password }) => {
    const normalizedEmail = String(email || "").toLowerCase();
    if (users.has(normalizedEmail)) {
        const error = new Error("Email already registered with other user");
        error.statusCode = 403;
        throw error;
    }

    const user = {
        _id: crypto.randomUUID(),
        name,
        email: normalizedEmail,
        username: normalizedEmail.split("@")[0],
        bio: "Learning with the local demo workspace.",
        password,
        avatar: "",
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
    };
    users.set(normalizedEmail, user);
    return sanitizeUser(user);
};

export const ensureDemoUser = () => {
    const demoEmail = "demo@local.test";
    if (!users.has(demoEmail)) {
        users.set(demoEmail, {
            _id: "demo-user",
            name: "Demo Learner",
            email: demoEmail,
            username: "demo",
            bio: "Use this account to explore the assistant without external services.",
            password: "Password@123",
            avatar: "",
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
        });
    }
    return sanitizeUser(users.get(demoEmail));
};

export const validateDemoLogin = ({ email, password }) => {
    ensureDemoUser();
    const normalizedEmail = String(email || "").toLowerCase();
    const user = users.get(normalizedEmail) || [...users.values()].find((item) => item.username === normalizedEmail);
    if (!user || user.password !== password) return null;
    otps.set(user.email, "123456");
    return sanitizeUser(user);
};

export const verifyDemoOtp = ({ email, otp }) => {
    const normalizedEmail = String(email || "").toLowerCase();
    const expectedOtp = otps.get(normalizedEmail) || "123456";
    const user = users.get(normalizedEmail);
    if (!user || String(otp) !== expectedOtp) return null;
    otps.delete(normalizedEmail);
    return sanitizeUser(user);
};

export const updateDemoUser = (id, updates) => {
    const user = getDemoUserById(id);
    if (!user) return null;
    const nextUser = { ...user, ...updates, email: String(updates.email || user.email).toLowerCase() };
    users.delete(user.email);
    users.set(nextUser.email, nextUser);
    return sanitizeUser(nextUser);
};

export const getDemoSafeUser = sanitizeUser;
