import { Scene } from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_HEIGHT } from "./utils";
import { initState, state } from "./state";

export function create(this: Scene): void {
  // Add background image
  this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, "background").setOrigin(0.5, 0.5);

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

  return player;
};

const initPlatforms = (scene: Scene) => {
  const platforms = scene.physics.add.staticGroup();
  
  // Create a seeded RNG
  const rng = new Phaser.Math.RandomDataGenerator(['penguin-jump-v1']);

  // Constants for platform generation
  const MIN_DISTANCE_Y = 60;
  const MAX_DISTANCE_Y = 100;
  const MIN_DISTANCE_X = 50;
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
    
    const minX = Math.max(PLATFORM_WIDTH/2, lastX - MAX_DISTANCE_X);
    const maxX = Math.min(GAME_WIDTH - PLATFORM_WIDTH/2, lastX + MAX_DISTANCE_X);
    const x = rng.between(minX, maxX);

    const platform = platforms.create(x, y, "platform");
    
    const width = Math.max(50, PLATFORM_WIDTH - (i * 0.5));
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
    immovable: true,
    bounceX: 0,
    bounceY: 0,
    dragX: 0,
    dragY: 0,
  });

  // Create a seeded RNG with a different seed for moving platforms
  const rng = new Phaser.Math.RandomDataGenerator(['penguin-jump-moving-v4']);

  // Constants for moving platform generation
  const PLATFORM_COUNT = MAP_HEIGHT / 200;
  const MIN_HEIGHT = 100;
  const MAX_HEIGHT = MAP_HEIGHT - 100;
  const PLATFORM_WIDTH = 70;

  for (let i = 0; i < PLATFORM_COUNT; i++) {
    const y = rng.between(MIN_HEIGHT, MAX_HEIGHT);
    const x = rng.between(PLATFORM_WIDTH/2, GAME_WIDTH - PLATFORM_WIDTH/2);

    const movingPlatform = scene.physics.add.image(x, y, "platformRed");
    movingPlatform.setDisplaySize(PLATFORM_WIDTH, 20);
    movingPlatform.refreshBody();
    movingPlatform.setImmovable(true);

    scene.tweens.add({
      targets: movingPlatform,
      x: x + GAME_WIDTH/3,
      ease: "Linear",
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    movingPlatforms.add(movingPlatform);
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
  scene.physics.add.collider(state.player, state.platformGroup);
  scene.physics.add.collider(state.player, state.movingPlatformGroup);

  // Add collision between player and bottomPlatformGroup
  scene.physics.add.collider(state.player, state.bottomPlatformGroup, () => {
    scene.physics.pause(); // Pause the physics engine
    state.player.setTint(0xff0000); // Change the player's color to red
    state.player.scale = 0.75;
    // Add a restart button
    const restartButton = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Restart", { fontSize: "32px", color: "#000" });
    restartButton.setOrigin(0.5, 0.5);
    restartButton.setInteractive(); // Allow the button to be clicked
    restartButton.on("pointerdown", () => {
      state.hasJumped = false;
      state.score = 0;
      state.scoreText.setText("Score: 0");
      scene.scene.restart();
    });
  });
};
