
import axios from 'axios';

async function testYouTube() {
    try {
        console.log("Testing YouTube Search...");
        // Assuming no auth for now on /search or providing token if needed?
        // Wait, I enabled auth. So this request will fail with 401 if I don't provide token.
        // But user said "youtube is not working", likely logged in on frontend.
        // To test logic, I should bypass auth or login first.
        // Let's modify youtube.routes.js AGAIN to bypass auth temporarily to debug logic error vs auth error.

        const response = await axios.get('http://localhost:8000/api/v1/youtube/search?query=coding');
        console.log("Status:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testYouTube();
