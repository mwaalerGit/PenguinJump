import { Scene } from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_HEIGHT, ON_MOVING_PLATFORM_KEY } from "./utils";
import { initState, state } from "./state";
import { GameOverScreen } from "./gameOverScreen";
import { backgroundShader } from "./shaders/background";

export function create(this: Scene): void {
  const shaderGameObject = this.add.shader(backgroundShader, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT * 1.2);

  this.events.on("update", () => {
    shaderGameObject.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
    shaderGameObject.setUniform("cameraY.value", this.cameras.main.scrollY);
    shaderGameObject.setUniform("time.value", this.time.now);
  });

  initState({
    platformGroup: initPlatforms(this),
    movingPlatformGroup: initMovingPlatforms(this),
    player: initPlayer(this),
    cursors: this.input.keyboard!.createCursorKeys(),
    scoreText: this.add.text(16, 16, "Score: 0", { fontSize: "32px", color: "#000" }).setScrollFactor(0),
    bottomPlatformGroup: createBottomPlatform(this),
    score: 0,
    hasJumped: false,
  });

  addCollisions(this);

  this.cameras.main.startFollow(state.player, true); // Set camera to follow the player
  this.cameras.main.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Match the camera bounds to the world bounds
  this.physics.world.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Extend the world bounds to allow upward movement

  // Add animations
  if (!this.anims.get("walk")) {
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("penguinWalk", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  }
}

const initPlayer = (scene: Scene) => {
  const player = scene.physics.add.sprite(200, MAP_HEIGHT - 90, "penguin");
  player.setCollideWorldBounds(true);
  player.setBounce(0.0);
  player.setDataEnabled();
  player.setImmovable(false);
  player.setPushable(true);

  return player;
};

const initPlatforms = (scene: Scene) => {
  const platforms = scene.physics.add.staticGroup();

  // Create a seeded RNG
  const rng = new Phaser.Math.RandomDataGenerator(["penguin-jump-v1"]);

  // Constants for platform generation
  const MIN_DISTANCE_Y = 60;
  const MAX_DISTANCE_Y = 100;
  // const MIN_DISTANCE_X = 50;
  const MAX_DISTANCE_X = 150;
  const PLATFORM_COUNT = 74;
  const PLATFORM_WIDTH = 100;

  // Create the starting platform
  const firstPlatform = platforms.create(200, MAP_HEIGHT - 50, "platform2");
  firstPlatform.setDisplaySize(PLATFORM_WIDTH, 20);
  firstPlatform.refreshBody();

  let lastX = 200;
  let lastY = MAP_HEIGHT - 50;

  // Generate platforms with seeded random positions
  for (let i = 1; i < PLATFORM_COUNT; i++) {
    const y = lastY - rng.between(MIN_DISTANCE_Y, MAX_DISTANCE_Y);

    const minX = Math.max(PLATFORM_WIDTH / 2, lastX - MAX_DISTANCE_X);
    const maxX = Math.min(GAME_WIDTH - PLATFORM_WIDTH / 2, lastX + MAX_DISTANCE_X);
    const x = rng.between(minX, maxX);

    const platform = platforms.create(x, y, "platform");

    const width = Math.max(50, PLATFORM_WIDTH - i * 0.5);
    platform.setDisplaySize(width, 20);
    platform.refreshBody();

    lastX = x;
    lastY = y;
  }

  return platforms;
};

function initMovingPlatforms(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  const movingPlatforms = scene.physics.add.group({
    allowGravity: false,
    immovable: false,
    bounceX: 0,
    bounceY: 0,
    dragX: 0,
    dragY: 0,
  });

  // Create a seeded RNG with a different seed for moving platforms
  const rng = new Phaser.Math.RandomDataGenerator(["penguin-jump-moving-v4"]);

  // Constants for moving platform generation
  const PLATFORM_COUNT = MAP_HEIGHT / 200;
  const PLATFORM_MIN_Y = 100;
  const PLATFORM_MAX_Y = MAP_HEIGHT - 100;
  const PLATFORM_WIDTH = 70;
  const PLATFORM_HEIGHT = 20;
  const PLATFORM_VELOCITY = 100;
  const PLATFORM_TURN_DELAY = 1500;

  for (let i = 0; i < PLATFORM_COUNT; i++) {
    const horizontalOrVertical = rng.between(0, 1);

    // Flip width and height if the platform is vertical
    const { width, height } = horizontalOrVertical === 0 ? { width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT } : { width: PLATFORM_HEIGHT, height: PLATFORM_WIDTH };

    const y = rng.between(PLATFORM_MIN_Y, PLATFORM_MAX_Y);
    const x = rng.between(width + 0, GAME_WIDTH - width / 2);

    const movingPlatform = scene.physics.add.image(x, y, "platformRed");

    movingPlatform.setDisplaySize(width, height);
    movingPlatform.setImmovable(true);
    movingPlatform.setPushable(false);
    movingPlatform.setCollideWorldBounds(false);
    movingPlatform.refreshBody();

    scene.time.addEvent({
      delay: PLATFORM_TURN_DELAY,
      loop: true,
      callback: () => {
        // Reset the platform if it's not moving
        if (movingPlatform.body.velocity.x === 0) {
          movingPlatform.setX(x);
          movingPlatform.setY(y);
          movingPlatform.setVelocityX(PLATFORM_VELOCITY);
          return;
        }
        movingPlatform.setVelocityX(-movingPlatform.body.velocity.x);
      },
    });

    movingPlatforms.add(movingPlatform);

    // Must be called after adding the platform to the group
    movingPlatform.setVelocityX(PLATFORM_VELOCITY);
  }

  return movingPlatforms;
}

const createBottomPlatform = (scene: Scene) => {
  const bottomPlatformGroup = scene.physics.add.staticGroup();
  const bottomPlatform = bottomPlatformGroup.create(200, MAP_HEIGHT, "platformRed");
  bottomPlatform.setDisplaySize(GAME_WIDTH, 20); // Set the width to 400 and height to 20
  bottomPlatform.refreshBody(); // Refresh the physics body to match the new size

  return bottomPlatformGroup;
};

const addCollisions = (scene: Scene) => {
  scene.physics.add.collider(state.player, state.platformGroup, () => {
    state.player.data.set(ON_MOVING_PLATFORM_KEY, false);
  });

  scene.physics.add.collider(state.player, state.movingPlatformGroup, (o1, o2) => {
    const player = o1 as Phaser.Physics.Arcade.Sprite;
    const platform = o2 as Phaser.Physics.Arcade.Image;

    const playerIsMoving = state.cursors.left.isDown || state.cursors.right.isDown;

    if (player.y < platform.y && !playerIsMoving) {
      player.data.set(ON_MOVING_PLATFORM_KEY, true);

      const platformVelocity = platform.body!.velocity;

      player.setVelocityX(platformVelocity.x);
    }
  });

  // Add collision between player and bottomPlatformGroup
  scene.physics.add.collider(state.player, state.bottomPlatformGroup, () => {
    handlePlayerDeath(scene);
  });
};

const handlePlayerDeath = (scene: Scene) => {
  scene.physics.pause();
  state.player.setTint(0xff0000);
  state.player.scale = 0.75;

  // Add death effects
  scene.cameras.main.shake(500, 0.005);

  // Create and add game over screen
  const gameOverScreen = new GameOverScreen(scene, state.score);
  scene.add.existing(gameOverScreen);
};
