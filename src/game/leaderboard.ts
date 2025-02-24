import { ScoreEntry } from "./types";

const STORAGE_KEY = "penguin-jump-scores";
const MAX_SCORES = 1000;

export function saveScore(username: string, score: number): void {
  try {
    const existingScores = getScores();

    const newScore: ScoreEntry = {
      username,
      score,
      timestamp: Date.now(),
    };

    const allScores = [...existingScores, newScore].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allScores));
  } catch (error) {
    console.error("Failed to save score:", error);
  }
}

function getScores(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
