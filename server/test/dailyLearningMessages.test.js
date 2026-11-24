import test from "node:test";
import assert from "node:assert/strict";
import { selectFreshThought } from "../src/utils/dailyLearningMessages.js";

test("daily thoughts do not repeat a user's previous messages", () => {
    const previousMessages = [];
    const selected = new Set();

    for (let day = 1; day <= 120; day += 1) {
        const thought = selectFreshThought({
            previousMessages,
            userId: "learner-1",
            dayKey: `2026-01-${String(day).padStart(2, "0")}`,
        });
        assert.equal(selected.has(thought), false, `Thought repeated on day ${day}`);
        selected.add(thought);
        previousMessages.push(thought);
    }
});

test("daily thought selection is stable for the same user and date", () => {
    const options = { previousMessages: [], userId: "learner-1", dayKey: "2026-11-24" };
    assert.equal(selectFreshThought(options), selectFreshThought(options));
});
