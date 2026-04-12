import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Question } from "../models/question.model.js";
import axios from "axios";

import dotenv from "dotenv";

dotenv.config({
	path: "./.env",
});

const API_URL = process.env.AI_API_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const buildFallbackResponse = (question) => {
	const cleaned = String(question || "learning").replace(/^Teach this clearly with examples and next steps:\s*/i, "").replace(/^Describe and teach about\s*/i, "").trim() || "learning";
	return {
		ai_response: `## ${cleaned}

Here is a practical training path you can use right now.

1. Start with the core idea and write it in your own words.
2. Learn one small example, then change one detail and predict the result.
3. Practice with three questions: one definition, one use case, and one troubleshooting case.
4. Teach the topic back in five sentences.

**Example activity:** create a mini note with: what it is, why it matters, one real-world example, common mistakes, and a next exercise.

**Next step:** ask me for a quiz, roadmap, or interview questions on ${cleaned}.`,
		topic: cleaned,
	};
};

const buildFallbackQuestions = (topic) => ([
	{ question: `What is the best first step when learning ${topic}?`, options: { A: "Memorize random facts", B: "Understand the core concept", C: "Skip practice", D: "Avoid examples" }, correct: "B", explanation: "A strong foundation makes examples and practice easier." },
	{ question: `Which habit improves retention for ${topic}?`, options: { A: "Active recall", B: "Only rereading", C: "Ignoring mistakes", D: "Studying once" }, correct: "A", explanation: "Active recall forces your brain to retrieve and strengthen knowledge." },
	{ question: `How should you check your understanding of ${topic}?`, options: { A: "Explain it simply", B: "Close the app", C: "Copy text only", D: "Avoid questions" }, correct: "A", explanation: "Simple explanation reveals gaps quickly." },
	{ question: `What makes practice effective for ${topic}?`, options: { A: "No feedback", B: "Increasing difficulty", C: "Random guessing", D: "No review" }, correct: "B", explanation: "Gradual challenge builds skill without overload." },
	{ question: `What should you do after a wrong answer in ${topic}?`, options: { A: "Ignore it", B: "Review why it was wrong", C: "Delete notes", D: "Stop learning" }, correct: "B", explanation: "Mistake review turns errors into useful feedback." },
]);

const getResponse = asyncHandler(async (req, res) => {
	const { question } = req.body;
	if (!question) {
		throw new ApiError(400, "Question is required");
	}

	const prompt = `
If the prompt is asking about educational material, give a proper response. If not, return this message:
**ask only generous and study related questions**

Always respond in the following strict **JSON format**:

{
  "ai_response": "The study material should be here.",
  "topic": "The related topic for the study material should be here.",
}

**Rules:**
- ONLY send valid JSON. No markdown or text outside the JSON object.
- Use double quotes for all JSON keys and string values.
- If the topic is study-related, generate a helpful educational answer.
- NEVER include links.
- Do not send anything outside the JSON object.

This is the question: "${question}"
`;

	const requestData = {
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
		model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
	};

	if (!API_URL || !GROQ_API_KEY) {
		return res.status(200).json(new ApiResponse(200, buildFallbackResponse(question), "Fallback AI response"));
	}

	let ai_response;

	try {
		const response = await axios.post(API_URL, requestData, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${GROQ_API_KEY}`,
			},
		});

		const aiGeneratedText =
			response.data?.choices?.[0]?.message?.content;
		// console.log(`🔹 AI Response for "${topic}":`, aiGeneratedText);
		if (!aiGeneratedText)
			throw new ApiError(500, `Invalid AI response for "${question}"`);

		try {
			// console.log(aiGeneratedText)
			console.log("Ai generated test", aiGeneratedText, "\n\n")
			const jsonMatch = aiGeneratedText.match(/\{[\s\S]*\}/);
			// console.log(jsonMatch, "json match");
			if (!jsonMatch) throw new Error("No JSON found in response.");
			ai_response = JSON.parse(jsonMatch[0]);
			// console.log("AI Response",ai_response);
		} catch (err) {
			throw new ApiError(
				300,
				"Something went wrong while parsing the JSON: " + err.message
			);
		}
	} catch (error) {
		// If it's already an ApiError, re-throw it
		if (error instanceof ApiError) {
			throw error;
		}
		// Otherwise, provide more details about the error
		console.error("AI API Error:", error.message);
		throw new ApiError(500, `AI API Error: ${error.message || "Cannot convert to json"}`);
	}

	// console.log(question,aiResponse)
	return res
		.status(200)
		.json(new ApiResponse(200, ai_response, "Got Response"));
});

const generateQuestion = asyncHandler(async (req, res) => {
	const { topics } = req.body;
	if (!topics || !Array.isArray(topics) || topics.length === 0) {
		throw new ApiError(404, "Missing or empty details");
	}

	const questionPromises = topics.map(async (topic) => {
		if (process.env.DEMO_MODE === "true" || !API_URL || !GROQ_API_KEY) {
			return { topic, questions: buildFallbackQuestions(topic) };
		}

		// 1. Check if questions exist in DB
		const existingQuestions = await Question.find({ topic }).limit(10);
		if (existingQuestions.length >= 5) {
			console.log(`Using cached questions for topic: ${topic}`);
			return { topic, questions: existingQuestions };
		}

		// 2. If not, generate via AI
		const prompt = `
		Generate a set of **exactly 5 to 10 multiple-choice questions** (MCQs) on the topic "${topic}".  
		Ensure each question follows this **strict JSON format**:

		[
			{
				"question": "What is AI?",
				"options": {
				"A": "Artificial Intelligence",
				"B": "Automated Input",
				"C": "Advanced Interaction",
				"D": "Analytical Insight"
				},
			"correct": "A"
			},
			...
		]

		**Rules:**
		- Each question must have exactly 4 options labeled "A", "B", "C", and "D".
		- Provide only valid JSON. Do not include any explanations or extra text.
		`;

		const requestData = {
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
		};

		try {
			const response = await axios.post(API_URL, requestData, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${GROQ_API_KEY}`,
				},
			});

			const aiGeneratedText =
				response.data?.choices?.[0]?.message?.content;
			// console.log(`🔹 AI Response for "${topic}":`, aiGeneratedText);

			if (!aiGeneratedText)
				throw new Error(`Invalid AI response for "${topic}"`);

			// ✅ Extract and parse JSON safely
			const jsonMatch = aiGeneratedText.match(/\[[\s\S]*\]/);
			if (!jsonMatch)
				throw new Error(`Invalid JSON format received for "${topic}"`);

			let questionsData;
			try {
				questionsData = JSON.parse(jsonMatch[0]);
				if (!Array.isArray(questionsData))
					throw new Error("AI did not return an array.");
			} catch (parseError) {
				throw new Error(
					`Failed to parse JSON for "${topic}": ${parseError.message}`
				);
			}

			// ✅ Ensure AI returns between 5 and 10 questions
			if (questionsData.length < 5) {
				throw new Error(
					`AI returned only ${questionsData.length} questions, expected at least 5.`
				);
			}

			// 3. Save to DB
			const savedQuestions = await Promise.all(
				questionsData.map(async (q) => {
					const newQuestion = new Question({
						topic,
						question: q.question,
						options: q.options,
						correct: q.correct,
					});
					return await newQuestion.save();
				})
			);

			return { topic, questions: savedQuestions };
		} catch (error) {
			console.error(
				`❌ Error generating questions for "${topic}":`,
				error.message
			);
			return { topic, error: error.message };
		}
	});

	const results = await Promise.all(questionPromises);
	const successfulTopics = results.filter((r) => !r.error);
	const failedTopics = results.filter((r) => r.error);

	if (successfulTopics.length === 0) {
		throw new ApiError(500, "Failed to generate Question for all topics");
	}

	return res.status(200).json({ topics: successfulTopics, failedTopics });
});

export default {
	getResponse,
	generateQuestion,
};
