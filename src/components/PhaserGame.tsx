import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { preload } from "../game/preload";
import { create } from "../game/create";
import { GAME_HEIGHT, GAME_WIDTH } from "../game/utils";
import { update } from "../game/update";

export default function PhaserGame() {
  const game = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!game.current) return;

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
  }, [game]);

  return <canvas autoFocus ref={game} id="game" />;
}
