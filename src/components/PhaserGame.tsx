import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { preload } from "../game/preload";
import { create } from "../game/create";
import { GAME_HEIGHT, GAME_WIDTH } from "../game/utils";
import { update } from "../game/update";

export default function PhaserGame() {
  const gameRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const game = new Phaser.Game({
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

    return () => {
      game.destroy(false);
    };
  }, [gameRef]);

  return <canvas ref={gameRef} id="game" />;
}
