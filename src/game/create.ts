import { Scene } from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_HEIGHT, ON_MOVING_PLATFORM_KEY } from "./utils";
import { initState, state } from "./state";
import { GameOverScreen } from "./gameOverScreen";
import { backgroundShader } from "./shaders/background";
import { PlatformType, PLATFORM_CONFIGS, PLATFORM_WEIGHTS } from "./types";



export function create(this: Scene): void {
  const shaderGameObject = this.add.shader(backgroundShader, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT * 1.2);

  this.events.on("update", () => {
    shaderGameObject.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
    shaderGameObject.setUniform("cameraY.value", this.cameras.main.scrollY);
    shaderGameObject.setUniform("time.value", this.time.now);
  });

  const platforms = initPlatforms(this);

  initState({
    platformGroup: platforms.platforms,
    movingPlatformGroup: platforms.movingPlatforms,
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
  const movingPlatforms = scene.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  // Create a seeded RNG
  const rng = new Phaser.Math.RandomDataGenerator(["penguin-jump-v1"]);

  // Constants for platform generation
  const MIN_DISTANCE_Y = 60;
  const MAX_DISTANCE_Y = 100;
  const MIN_DISTANCE_X = 50;
  const MAX_DISTANCE_X = 150;
  const PLATFORM_COUNT = 74;

  // Create the starting platform
  createNormalPlatform(scene, platforms, 200, MAP_HEIGHT - 50, PLATFORM_CONFIGS[PlatformType.NORMAL].width);

  let lastX = 200;
  let lastY = MAP_HEIGHT - 50;

  // Generate platforms with seeded random positions
  for (let i = 1; i < PLATFORM_COUNT; i++) {
    const y = lastY - rng.between(MIN_DISTANCE_Y, MAX_DISTANCE_Y);
    const minX = Math.max(PLATFORM_CONFIGS[PlatformType.NORMAL].width / 2, lastX - MAX_DISTANCE_X);
    const maxX = Math.min(GAME_WIDTH - PLATFORM_CONFIGS[PlatformType.NORMAL].width / 2, lastX + MAX_DISTANCE_X);
    const x = rng.between(minX, maxX);

    // Determine platform type based on weights
    const platformType = getWeightedPlatformType(rng);
    
    switch(platformType) {
      case PlatformType.NORMAL:
        createNormalPlatform(scene, platforms, x, y, PLATFORM_CONFIGS[PlatformType.NORMAL].width - i * 0.5);
        break;
      case PlatformType.MOVING:
        createMovingPlatform(scene, movingPlatforms, x, y);
        break;
      case PlatformType.ICE:
        createIcePlatform(scene, platforms, x, y, PLATFORM_CONFIGS[PlatformType.ICE].width - i * 0.5);
        break;
    }

    lastX = x;
    lastY = y;
  }

  return { platforms, movingPlatforms };
};

const createNormalPlatform = (scene: Scene, group: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, width: number) => {
  const platform = group.create(x, y, PLATFORM_CONFIGS[PlatformType.NORMAL].texture);
  platform.setDisplaySize(width, PLATFORM_CONFIGS[PlatformType.NORMAL].height);
  platform.refreshBody();
  return platform;
};

const createMovingPlatform = (scene: Scene, group: Phaser.Physics.Arcade.Group, x: number, y: number) => {
  const config = PLATFORM_CONFIGS[PlatformType.MOVING];
  const platform = scene.physics.add.image(x, y, config.texture);
  platform.setDisplaySize(config.width, config.height);
  platform.setImmovable(true);
  platform.refreshBody();

  scene.tweens.add({
    targets: platform,
    x: x + GAME_WIDTH/3,
    ease: 'Linear',
    duration: 2000,
    yoyo: true,
    repeat: -1
  });

  group.add(platform);
  return platform;
};

const createIcePlatform = (scene: Scene, group: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, width: number) => {
  const platform = group.create(x, y, PLATFORM_CONFIGS[PlatformType.ICE].texture);
  platform.setDisplaySize(width, PLATFORM_CONFIGS[PlatformType.ICE].height);
  platform.refreshBody();
  platform.setData('isIce', true);
  return platform;
};

const getWeightedPlatformType = (rng: Phaser.Math.RandomDataGenerator): PlatformType => {
  const total = Object.values(PLATFORM_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = rng.between(1, total);
  
  for (const [type, weight] of Object.entries(PLATFORM_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return type as PlatformType;
    }
  }
  
  return PlatformType.NORMAL; // Fallback
};

const createBottomPlatform = (scene: Scene) => {
  const bottomPlatformGroup = scene.physics.add.staticGroup();
  const bottomPlatform = bottomPlatformGroup.create(GAME_WIDTH/2, MAP_HEIGHT, "platformRed");
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
