import { Scene } from "phaser";
import { state } from "./state";
import { CursorKeys, MAP_HEIGHT, MAX_SCORE, Player, GAME_WIDTH, ON_MOVING_PLATFORM_KEY, DAMPING_FACTOR, MAX_SPEED, MOVEMENT_SPEED } from "./utils";

export function update(this: Scene): void {
  const { cursors, player, scoreText, score, hasJumped } = state;

  handlePlayerMovement(cursors, player);

  adjustCameraPosition(this, player);

  if (hasJumped) {
    elevateBottomPlatform();
  }

  state.score = Math.min(MAX_SCORE, Math.max(score, Math.floor((MAP_HEIGHT - player.y) / 10)));
  scoreText.setText("Score: " + score);
}

const handlePlayerMovement = (cursors: CursorKeys, player: Player) => {
  const playerVelocity = player.body!.velocity;
  let newVelocityX = playerVelocity.x;

  if (cursors.left?.isDown) newVelocityX -= MOVEMENT_SPEED;
  if (cursors.right?.isDown) newVelocityX += MOVEMENT_SPEED;

  newVelocityX = Math.min(Math.max(newVelocityX, -MAX_SPEED), MAX_SPEED);

  const isStandingOnMovingPlatform = player.data.get(ON_MOVING_PLATFORM_KEY);
  if (player.body?.blocked.down && !isStandingOnMovingPlatform) newVelocityX *= DAMPING_FACTOR;

  player.setVelocityX(newVelocityX);

  if (cursors.left.isDown || cursors.right.isDown) player.anims.play("walk", true);
  else player.anims.play("walk", false);

  if ((cursors.space?.isDown || cursors.up?.isDown) && player?.body?.blocked.down) {
    player.setVelocityY(-250);
    state.hasJumped = true;
  }
};

const adjustCameraPosition = (scene: Scene, player: Player) => {
  if (player.y < scene.cameras.main.scrollY + 200) {
    scene.cameras.main.scrollY = player.y - 200;
  }
};

const elevateBottomPlatform = () => {
  const bottomPlatform = state.bottomPlatformGroup.getChildren()[0] as Phaser.GameObjects.Shader;
  const currentHeight = bottomPlatform.height;
  const newHeight = currentHeight + 0.1;

  bottomPlatform.setSize(GAME_WIDTH, newHeight);
  bottomPlatform.y = MAP_HEIGHT - newHeight / 2;

  const physicsBody = bottomPlatform.body as Phaser.Physics.Arcade.StaticBody;
  physicsBody.y = MAP_HEIGHT - newHeight / 2;
};
