import { Scene } from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, handleRestart } from "./utils";

import { state } from "./state";
import { saveScore } from "./leaderboard";

export class GameOverScreen extends Phaser.GameObjects.Container {
  private username = "";
  private usernameText: Phaser.GameObjects.Text;
  private usernamePrompt: Phaser.GameObjects.Text;

  constructor(scene: Scene, score: number) {
    super(scene, 0, 0);
    this.setScrollFactor(0);

    // Add dark overlay
    const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    // Create UI elements
    const gameOverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, "Game Over!", { fontSize: "48px", color: "#ffffff" }).setOrigin(0.5);

    const scoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `Final Score: ${score}`, { fontSize: "32px", color: "#ffffff" }).setOrigin(0.5);

    this.usernamePrompt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Enter your name:", { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5);

    const inputBackground = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 200, 40, 0xffffff, 0.2);

    this.usernameText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "|", { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5);

    const restartButton = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, "Submit & Restart", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Add hover effects
    restartButton
      .on("pointerover", () =>
        restartButton.setStyle({
          backgroundColor: "rgba(255, 255, 255, 0.4)",
        })
      )
      .on("pointerout", () =>
        restartButton.setStyle({
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        })
      )
      .on("pointerdown", () => this.handleSubmit());

    // Add all elements to container
    this.add([overlay, gameOverText, scoreText, this.usernamePrompt, inputBackground, this.usernameText, restartButton]);

    // Setup keyboard input
    this.setupKeyboardInput(scene);
  }

  private setupKeyboardInput(scene: Scene) {
    scene.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        this.username = this.username.slice(0, -1);
      } else if (event.key.length === 1 && this.username.length < 15) {
        this.username += event.key;
      }
      this.usernameText.setText(this.username + "|");
    });

    scene.input.keyboard?.addKey("ENTER").on("down", () => {
      this.handleSubmit();
    });
  }

  private handleSubmit() {
    if (this.username.trim()) {
      saveScore(this.username.trim(), state.score);
      handleRestart(this.scene);
    } else {
      this.usernamePrompt.setText("Please enter a name!").setColor("#ff0000");
    }
  }
}
