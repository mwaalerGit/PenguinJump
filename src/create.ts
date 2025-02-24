import { Scene } from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_HEIGHT } from "./utils";
import { initState, state } from "./state";
import { GameOverScreen } from "./gameOverScreen";

export function create(this: Scene): void {
  const fragmentShader = `
  precision mediump float;

  uniform float cameraY;
  uniform float time;
  uniform vec2 resolution;

  // Pseudo-random function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth interpolation
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  void main() {
      // Normalized coordinates
      vec2 uv = gl_FragCoord.xy/resolution.xy;
      float normalizedY = cameraY / 600.0;

      vec3 topColor = vec3(0.45, 0.5, 1.0);
      vec3 middleColor = vec3(0.3, 0.4, 0.6);
      vec3 bottomColor = vec3(0.1, 0.04, 0.08);
      
      // Add some moving noise
      float noiseScale = 4.0;
      float noiseMorphSpeed = time * 0.25;
      float timeScale = normalizedY * 0.5;
      float noiseIntensity = 0.4 - (1.0 - normalizedY) * 0.2;
      float noiseValue = noise(vec2(uv.x * noiseScale + noiseMorphSpeed, (uv.y + timeScale) * noiseScale + noiseMorphSpeed)) * noiseIntensity;
      
      vec3 color;
      if (normalizedY < 0.5) {
          color = mix(topColor, middleColor, normalizedY * 2.0);
      } else {
          color = mix(middleColor, bottomColor, (normalizedY - 0.5) * 2.0);
      }
      
      // Add noise to the final color
      color += vec3(noiseValue);
      
      gl_FragColor = vec4(color, 1.0);
  }
`;

  const baseShader = new Phaser.Display.BaseShader("bg1", fragmentShader, undefined, {
    cameraY: { type: "1f", value: 0.0 },
    resolution: { type: "2f", value: { x: GAME_WIDTH, y: GAME_HEIGHT } },
    time: { type: "1f", value: 0.0 },
  });

  const shaderGameObject = this.add.shader(baseShader, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT * 1.2);

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

  return player;
};

const initPlatforms = (scene: Scene) => {
  const platforms = scene.physics.add.staticGroup();

  // Create a seeded RNG
  const rng = new Phaser.Math.RandomDataGenerator(["penguin-jump-v1"]);

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
    immovable: true,
    bounceX: 0,
    bounceY: 0,
    dragX: 0,
    dragY: 0,
  });

  // Create a seeded RNG with a different seed for moving platforms
  const rng = new Phaser.Math.RandomDataGenerator(["penguin-jump-moving-v4"]);

  // Constants for moving platform generation
  const PLATFORM_COUNT = MAP_HEIGHT / 200;
  const MIN_HEIGHT = 100;
  const MAX_HEIGHT = MAP_HEIGHT - 100;
  const PLATFORM_WIDTH = 70;

  for (let i = 0; i < PLATFORM_COUNT; i++) {
    const y = rng.between(MIN_HEIGHT, MAX_HEIGHT);
    const x = rng.between(PLATFORM_WIDTH / 2, GAME_WIDTH - PLATFORM_WIDTH / 2);

    const movingPlatform = scene.physics.add.image(x, y, "platformRed");
    movingPlatform.setDisplaySize(PLATFORM_WIDTH, 20);
    movingPlatform.refreshBody();
    movingPlatform.setImmovable(true);

    scene.tweens.add({
      targets: movingPlatform,
      x: x + GAME_WIDTH / 3,
      ease: "Linear",
      duration: 2000,
      yoyo: true,
      repeat: -1,
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
  const gameOverScreen = new GameOverScreen(scene, state.score, (username: string) => {
    // TODO: Save username and score to leaderboard
    handleRestart(scene);
  });
  
  scene.add.existing(gameOverScreen);
};

const handleRestart = (scene: Scene) => {
  state.hasJumped = false;
  state.score = 0;
  state.scoreText.setText("Score: 0");
  scene.scene.restart();
};
