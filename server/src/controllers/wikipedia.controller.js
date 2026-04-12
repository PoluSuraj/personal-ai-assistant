import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import axios from "axios";

const searchArticles = asyncHandler(async (req, res) => {
    const { query } = req.query;

    console.log(`Wikipedia search query: ${query}`);

    if (!query) {
        throw new ApiError(400, "Query parameter is required");
    }

    try {
        const response = await axios.get("https://en.wikipedia.org/w/api.php", {
            params: {
                action: "query",
                format: "json",
                origin: "*",
                list: "search",
                srsearch: query
            },
            headers: {
                'User-Agent': 'AiTutorApp/1.0 (contact@example.com)' // Good practice for Wiki API
            }
        });

        const results = response.data.query ? response.data.query.search : [];
        console.log(`Wikipedia found ${results.length} results for: ${query}`);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error("Wikipedia API Error Details:", error.response ? error.response.data : error.message);
        throw new ApiError(500, "Failed to fetch articles from Wikipedia");
    }
});

export default {
    searchArticles
};
