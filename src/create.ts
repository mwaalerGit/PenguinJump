import { Scene } from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_HEIGHT } from "./utils";
import { initState, state } from "./state";

export function create(this: Scene): void {
  const fragmentShader = `
    precision mediump float;
    
    uniform float cameraY;
    uniform vec2 resolution;
    
    void main() {
        // Convert pixel position to 0-1 range
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Create three color zones based on camera height
        vec3 skyColor = vec3(0.4, 0.6, 1.0);    // Blue
        vec3 midColor = vec3(0.8, 0.3, 0.5);    // Purple
        vec3 highColor = vec3(0.1, 0.1, 0.2);   // Dark blue
        
        // Mix colors based on vertical position and camera
        float heightFactor = uv.y - (cameraY / 10000.0);
        vec3 finalColor;
        
        if (heightFactor < 0.33) {
            finalColor = mix(skyColor, midColor, heightFactor * 3.0);
        } else if (heightFactor < 0.66) {
            finalColor = mix(midColor, highColor, (heightFactor - 0.33) * 3.0);
        } else {
            finalColor = highColor;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const baseShader = new Phaser.Display.BaseShader("bg1", fragmentShader);

  const shaderGameObject = this.add.shader(baseShader, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);

  shaderGameObject.setUniform("resolution.x", GAME_WIDTH);
  shaderGameObject.setUniform("resolution.y", GAME_HEIGHT);
  shaderGameObject.setUniform("cameraY", 0);

  this.events.on("update", () => {
    shaderGameObject.setUniform("cameraY", this.cameras.main.scrollY);
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
  const player = scene.physics.add.sprite(200, MAP_HEIGHT - 40, "penguin");
  player.setCollideWorldBounds(true);
  player.setBounce(0.0);

  return player;
};

const initPlatforms = (scene: Scene) => {
  const platforms = scene.physics.add.staticGroup();

  // Create the first platform at a fixed position
  const firstPlatform = platforms.create(200, MAP_HEIGHT - 10, "platform2");
  firstPlatform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
  firstPlatform.refreshBody(); // Refresh the physics body to match the new size

  const lastPlatform = platforms.create(200, MAP_HEIGHT - (MAP_HEIGHT - 100), "platform2");
  lastPlatform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
  lastPlatform.refreshBody(); // Refresh the physics body to match the new size

  // Generate platforms with static positions
  const fixedPositions = [
    { x: 250, y: 500 },
    { x: 100, y: 400 },
    { x: 250, y: 300 },
    { x: 350, y: 200 },
  ];

  fixedPositions.forEach((pos) => {
    const platform = platforms.create(pos.x, pos.y, "platform");
    platform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
    platform.refreshBody(); // Refresh the physics body to match the new size
  });

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

  const movingPlatformRedPositions = [
    { x: 150, y: 450 },
    { x: 250, y: 350 },
  ];

  movingPlatformRedPositions.forEach((pos) => {
    const movingPlatformRed = scene.physics.add.image(pos.x, pos.y, "platformRed");
    movingPlatformRed.setDisplaySize(10, 100);
    movingPlatformRed.refreshBody();
    scene.tweens.add({
      targets: movingPlatformRed,
      x: pos.x + GAME_WIDTH / 2,
      ease: "Linear",
      duration: 3000,
      yoyo: true,
      repeat: -1,
    });
    movingPlatforms.add(movingPlatformRed);
  });

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
