
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const logFile = 'debug_pro.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log("Starting Debug (Gemini Pro)...");
const API_URL = process.env.AI_API_URL;
log(`URL from env: ${API_URL}`);

if (!API_URL) {
    log("ERROR: AI_API_URL is missing!");
    process.exit(1);
}

// Check if URL contains gemini-pro
if (!API_URL.includes('gemini-pro')) {
    log("WARNING: URL does not look like gemini-pro. Check .env file.");
}

async function testGeminiPro() {
    try {
        log("Sending request...");
        const response = await axios.post(
            API_URL,
            {
                contents: [{
                    parts: [{ text: "Hello, are you working?" }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        log(`Response Status: ${response.status}`);
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        log(`Response Text: ${text ? text.substring(0, 100) : "EMPTY"}`);
    } catch (err) {
        log(`ERROR: ${err.message}`);
        if (err.response) {
            log(`Status: ${err.response.status}`);
            log(`Response Data: ${JSON.stringify(err.response.data, null, 2)}`);
        }
    }
}

testGeminiPro();
