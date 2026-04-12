import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const output = [
    `PORT: ${process.env.PORT}`,
    `MONGODB_URL: ${process.env.MONGODB_URL ? "Defined" : "Undefined"}`,
    `YOUTUBE_API_KEY: ${process.env.YOUTUBE_API_KEY ? "Defined (" + process.env.YOUTUBE_API_KEY.substring(0, 5) + "...)" : "Undefined"}`
].join('\n');

fs.writeFileSync('env_check.txt', output);
