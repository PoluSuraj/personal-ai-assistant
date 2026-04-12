import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import axios from "axios";

const searchVideos = asyncHandler(async (req, res) => {
    const { query } = req.query;

    console.log(`YouTube search query: ${query}`);

    if (!query) {
        throw new ApiError(400, "Query parameter is required");
    }

    const API_KEY = process.env.YOUTUBE_API_KEY;
    const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

    if (!API_KEY) {
        const fallbackVideos = [
            { id: { videoId: "dQw4w9WgXcQ" }, snippet: { title: `${query} - learning starter`, description: "Add a YouTube API key for live recommendations. This placeholder keeps the page interactive in demo mode." } },
            { id: { videoId: "ysz5S6PUM-U" }, snippet: { title: `${query} - practice walkthrough`, description: "Demo recommendation for local testing without external API credentials." } },
            { id: { videoId: "jNQXAC9IVRw" }, snippet: { title: `${query} - concept overview`, description: "Use this card to verify the video layout and interactions." } },
        ];
        return res.status(200).json({ success: true, data: fallbackVideos, fallback: true });
    }

    try {
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
        console.log(`YouTube found ${items.length} videos for: ${query}`);

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error("YouTube API Error Details:", error.response ? error.response.data : error.message);
        throw new ApiError(500, "Failed to fetch videos from YouTube");
    }
});

export default {
    searchVideos
};
