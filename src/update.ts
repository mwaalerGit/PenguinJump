import { Scene } from "phaser";
import { state } from "./state";
import { CursorKeys, MAP_HEIGHT, MAX_SCORE, Player, GAME_WIDTH } from "./utils";

export function update(this: Scene): void {
  const { cursors, player, scoreText, score, hasJumped } = state;

  handlePlayerMovement(cursors, player);

  adjustCameraPosition(this, player);

  if (hasJumped) {
    const bottomPlatform = state.bottomPlatformGroup.getChildren()[0] as Phaser.Physics.Arcade.Sprite;
    const currentHeight = bottomPlatform.displayHeight;
    const newHeight = currentHeight + 0.1;
    bottomPlatform.setDisplaySize(GAME_WIDTH, newHeight);
    bottomPlatform.setY(MAP_HEIGHT - newHeight / 2); // Anchor the platform to the bottom of the screen
    bottomPlatform.refreshBody();
  }

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

  if (cursors.space?.isDown) {
    //|| cursors.up?.isDown) && player?.body?.blocked.down) {
    player.setVelocityY(-250);
    state.hasJumped = true;
  }
};

const adjustCameraPosition = (scene: Scene, player: Player) => {
  if (player.y < scene.cameras.main.scrollY + 200) {
    scene.cameras.main.scrollY = player.y - 200;
  }
};
