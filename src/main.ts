import Phaser from "phaser";
import { preload } from "./preload";
import { create } from "./create";
import { GAME_HEIGHT, GAME_WIDTH } from "./utils";
import { update } from "./update";

new Phaser.Game({
  type: Phaser.WEBGL,
  canvas: document.getElementById("game") as HTMLCanvasElement,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
});
