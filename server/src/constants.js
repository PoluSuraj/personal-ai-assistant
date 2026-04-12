const DB_Name = "AI_TUTOR";
const accessTokenAge = 30 * 24 * 60 * 60 * 1000;
const refreshTokenAge = 60 * 24 * 60 * 60 * 1000;

const accessTokenOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: accessTokenAge,
};
const refreshTokenOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: refreshTokenAge,
};

export {
    DB_Name,
    accessTokenAge,
    refreshTokenAge,
    accessTokenOptions,
    refreshTokenOptions,
};
