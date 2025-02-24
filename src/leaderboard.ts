import { ScoreEntry } from "./types";

const STORAGE_KEY = 'penguin-jump-scores';
const MAX_SCORES = 1000;

export function saveScore(username: string, score: number): void {
    try {
        const existingScores = getScores();
        
        const newScore: ScoreEntry = {
            username,
            score,
            timestamp: Date.now()
        };

        const allScores = [...existingScores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_SCORES);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allScores));
    } catch (error) {
        console.error('Failed to save score:', error);
    }
}

function getScores(): ScoreEntry[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function clearScores(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function updateLeaderboard() {
    const scores = getScores();

    let leaderboard = document.createElement('div');
    leaderboard.appendChild(document.createElement('p'));
    leaderboard.style.display = 'flex';
    leaderboard.style.flexDirection = 'column';
    leaderboard.style.alignItems = 'center';

    scores.forEach((entry, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.width = '200px';

        const rank = document.createElement('span');
        rank.textContent = `${index + 1}.`;
        rank.style.marginRight = '10px';

        const username = document.createElement('span');
        username.textContent = entry.username;
        username.style.flex = '1';

        const score = document.createElement('span');
        score.textContent = entry.score.toString();

        row.appendChild(rank);
        row.appendChild(username);
        row.appendChild(score);
        leaderboard.appendChild(row);
    });

    console.log("Updating Leaderboard!")
    let container = document.getElementById('leaderboard');
    if (container) {
        container.innerHTML = '';
        container.appendChild(leaderboard);
    }

};