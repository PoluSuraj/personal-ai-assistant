
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const logFile = 'list_models.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    log("No GROQ_API_KEY found in .env");
    process.exit(1);
}

async function listModels() {
    try {
        log("Fetching available Groq models...\n");
        const response = await axios.get(
            `https://api.groq.com/openai/v1/models`,
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                }
            }
        );
        log("Available Models:");
        response.data.data.forEach(m => {
            log(`- ${m.id}`);
        });
    } catch (err) {
        log(`ERROR: ${err.message}`);
        if (err.response) {
            log(`Status: ${err.response.status}`);
            log(`Response: ${JSON.stringify(err.response.data, null, 2)}`);
        }
    }
}

listModels();
