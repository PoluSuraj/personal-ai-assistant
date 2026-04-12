
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function testYouTube() {
    console.log("Starting test...");
    const query = "coding";
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

    if (!API_KEY) {
        fs.writeFileSync('youtube_test_result.txt', "Error: YOUTUBE_API_KEY not found in env");
        return;
    }

    try {
        console.log(`Using Key: ${API_KEY.substring(0, 5)}...`);
        const response = await axios.get(BASE_URL, {
            params: {
                part: "snippet",
                q: query,
                type: "video",
                maxResults: 6,
                key: API_KEY
            }
        });

        const items = response.data.items || [];
        const result = {
            success: true,
            status: response.status,
            itemCount: items.length,
            firstItem: items.length > 0 ? items[0].snippet.title : "None"
        };
        fs.writeFileSync('youtube_test_result.txt', JSON.stringify(result, null, 2));
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
        fs.writeFileSync('youtube_test_result.txt', JSON.stringify(errorDetails, null, 2));
        console.log("Error written to file.");
    }
}

testYouTube();
