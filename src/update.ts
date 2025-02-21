import { Scene } from "phaser";
import { state } from "./state";
import { CursorKeys, MAP_HEIGHT, MAX_SCORE, Player } from "./utils";

export function update(this: Scene): void {
  const { cursors, player, scoreText, score } = state;

  handlePlayerMovement(cursors, player);

  adjustCameraPosition(this, player);

  state.score = Math.min(MAX_SCORE, Math.max(score, Math.floor((MAP_HEIGHT - player.y) / 10)));
  scoreText.setText("Score: " + score);
}

const handlePlayerMovement = (cursors: CursorKeys, player: Player) => {
  if (cursors.left?.isDown) {
    player.setVelocityX(-160);
    player.anims.play("walk", true);
  } else if (cursors.right?.isDown) {
    player.setVelocityX(160);
    player.anims.play("walk", true);
  } else {
    player.anims.play("walk", false);
    player.setVelocityX(0);
  }

  if ((cursors.space?.isDown || cursors.up?.isDown) && player?.body?.blocked.down) {
    player.setVelocityY(-250);
  }
};

const adjustCameraPosition = (scene: Scene, player: Player) => {
  if (player.y < scene.cameras.main.scrollY + 200) {
    scene.cameras.main.scrollY = player.y - 200;
  }
};
