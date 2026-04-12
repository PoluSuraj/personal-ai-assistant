
import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to log to file
const logFile = path.join(__dirname, 'diagnostic_report.txt');
function log(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, line);
}

// Clear previous log
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log("Starting Diagnostic...");
log(`Current Directory: ${process.cwd()}`);
log(`Script Directory: ${__dirname}`);

// 1. Check .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    log(".env file found.");
    dotenv.config({ path: envPath });
} else {
    log("ERROR: .env file NOT found!");
}

// 2. Check Variables
const apiKey = process.env.YOUTUBE_API_KEY;
log(`YOUTUBE_API_KEY: ${apiKey ? 'Present' : 'Missing'}`);
if (apiKey) {
    log(`Key prefix: ${apiKey.substring(0, 5)}...`);
}

// 3. Connectivity Check
try {
    log("Checking Internet Connectivity (google.com)...");
    await axios.get('https://www.google.com');
    log("Connectivity OK.");
} catch (err) {
    log(`Connectivity ERROR: ${err.message}`);
}

// 4. Test YouTube API
if (apiKey) {
    log("Testing YouTube API...");
    const url = "https://www.googleapis.com/youtube/v3/search";
    try {
        const response = await axios.get(url, {
            params: {
                part: "snippet",
                q: "test",
                type: "video",
                maxResults: 1,
                key: apiKey
            }
        });
        log(`YouTube API Success! Status: ${response.status}`);
        log(`Items found: ${response.data.items?.length || 0}`);
    } catch (err) {
        log(`YouTube API Failed: ${err.message}`);
        if (err.response) {
            log(`Status: ${err.response.status}`);
            log(`Response: ${JSON.stringify(err.response.data)}`);
        }
    }
} else {
    log("Skipping YouTube Test (No Key).");
}

log("Diagnostic Complete.");
