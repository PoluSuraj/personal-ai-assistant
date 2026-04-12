
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
    console.log("Starting AI Test...");
    const API_URL = process.env.AI_API_URL;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!API_URL) {
        fs.writeFileSync('ai_test_result.txt', "Error: AI_API_URL not found in env");
        return;
    }

    if (!GROQ_API_KEY) {
        fs.writeFileSync('ai_test_result.txt', "Error: GROQ_API_KEY not found in env");
        return;
    }

    console.log(`Using URL: ${API_URL.substring(0, 50)}...`);
    console.log(`Using API Key: ${GROQ_API_KEY.substring(0, 20)}...`);

    const prompt = "Explain what is AI in one sentence.";
    const requestData = {
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
    };

    try {
        const response = await axios.post(API_URL, requestData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
        });

        const text = response.data?.choices?.[0]?.message?.content;
        const result = {
            success: true,
            status: response.status,
            text: text || "No text found"
        };
        fs.writeFileSync('ai_test_result.txt', JSON.stringify(result, null, 2));
        console.log("Success written to file.");

    } catch (error) {
        console.error("Caught error");
        let errorDetails = {
            success: false,
            message: error.message
        };
        if (error.response) {
            errorDetails.status = error.response.status;
            errorDetails.data = error.response.data;
        }
        fs.writeFileSync('ai_test_result.txt', JSON.stringify(errorDetails, null, 2));
        console.log("Error written to file.");
    }
}

testAI();
