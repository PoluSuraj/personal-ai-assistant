
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const logFile = 'model_test_results.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const API_KEY = process.env.AI_API_URL.match(/key=([^&]*)/)?.[1];
if (!API_KEY) {
    log("No API Key found.");
    process.exit(1);
}

const modelsToTest = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-1.0-pro'
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    log(`Testing ${modelName}...`);
    try {
        const response = await axios.post(
            url,
            {
                contents: [{
                    parts: [{ text: "Hi" }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        log(`[SUCCESS] ${modelName}: Status ${response.status}`);
        return true;
    } catch (err) {
        log(`[FAIL] ${modelName}: ${err.message}`);
        if (err.response) {
            log(`Status: ${err.response.status} - ${JSON.stringify(err.response.data.error.message)}`);
        }
        return false;
    }
}

async function runTests() {
    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) {
            log(`\nRECOMMENDATION: Use ${model}`);
            break; // Stop after first success to save time/quota
        }
    }
}

runTests();
