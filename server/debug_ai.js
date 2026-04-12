
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const logFile = 'debug_ai_result.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log("Starting AI Debug...");
const API_URL = process.env.AI_API_URL;

if (!API_URL) {
    log("ERROR: AI_API_URL is missing!");
    process.exit(1);
}

log(`URL: ${API_URL.split('?')[0]}`);
const keyMatch = API_URL.match(/key=([^&]*)/);
const key = keyMatch ? keyMatch[1] : null;

if (key) {
    log(`Key (first 5 chars): ${key.substring(0, 5)}...`);
} else {
    log("ERROR: No key found in URL query param");
}

async function testGemini() {
    try {
        log("Sending request...");
        const response = await axios.post(
            API_URL,
            {
                contents: [{
                    parts: [{ text: "Hello AI" }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        log(`Response Status: ${response.status}`);
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        log(`Response Text: ${text ? text.substring(0, 50) + "..." : "EMPTY"}`);
    } catch (err) {
        log(`ERROR: ${err.message}`);
        if (err.response) {
            log(`Status: ${err.response.status}`);
            log(`Response Data: ${JSON.stringify(err.response.data, null, 2)}`);
        }
    }
}

testGemini();
