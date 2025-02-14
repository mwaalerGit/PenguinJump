import Phaser from 'phaser';

type Platform = Phaser.Physics.Arcade.StaticGroup;
type Player = Phaser.Physics.Arcade.Sprite;

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

// Define constants
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const MAP_HEIGHT = 600;
const PLATFORM_COUNT = 74;
const MIN_DISTANCE_Y = 50;
const MAX_DISTANCE_Y = 100;
const MIN_DISTANCE_X = 50;
const MAX_DISTANCE_X = 200;

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

let player: Player;
let cursors: CursorKeys;
let platforms: Platform;

const game = new Phaser.Game(config);

function preload(this: Phaser.Scene): void {
    this.load.image('background', '/assests/background.jpg');
    this.load.image('platform', '/assests/platform.jpg');
    this.load.image('platform2', '/assests/platform.png');
    this.load.image('penguin', '/assests/penguinSpriteIdle.png');
}

function create(this: Phaser.Scene): void {
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background').setOrigin(0.5, 0.5);

    platforms = this.physics.add.staticGroup();
    generatePlatforms(this);

    player = this.physics.add.sprite(200, MAP_HEIGHT-200, 'penguin'); // Start the player near the bottom of the map
    player.setCollideWorldBounds(true);
    player.setBounce(0.0);

    this.physics.add.collider(player, platforms);

    cursors = this.input?.keyboard?.createCursorKeys() as CursorKeys;    

    this.cameras.main.startFollow(player, true);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Match the camera bounds to the world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Extend the world bounds to allow upward movement

    //this.cameras.main.scrollY = MAP_HEIGHT - this.cameras.main.height; // Set the initial camera position to the bottom of the map
}

function update(this: Phaser.Scene): void {
    if (cursors.left?.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right?.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }
    
    if (cursors.space?.isDown && player?.body?.blocked.down) {
        player.setVelocityY(-250);
    }

    // Move camera upwards if player jumps higher
    if (player.y < this.cameras.main.scrollY + 200) {
        this.cameras.main.scrollY = player.y - 200;
    }
}

function generatePlatforms(scene: Phaser.Scene): void {

    // Create the first platform at a fixed position
    const firstPlatform = platforms.create(200, MAP_HEIGHT-100, 'platform2');
    firstPlatform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
    firstPlatform.refreshBody(); // Refresh the physics body to match the new size

    const lastPlatform = platforms.create(200, MAP_HEIGHT - (MAP_HEIGHT - 100), 'platform2');
    lastPlatform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
    lastPlatform.refreshBody(); // Refresh the physics body to match the new size

    let lastPlatformY = MAP_HEIGHT-100;
    let lastPlatformX = 200;

    for (let i = 1; i < PLATFORM_COUNT; i++) {
        const posY = lastPlatformY - Phaser.Math.Between(MIN_DISTANCE_Y, MAX_DISTANCE_Y);
        const posX = Phaser.Math.Between(
            Math.max(50, lastPlatformX - MAX_DISTANCE_X),
            Math.min(350, lastPlatformX + MAX_DISTANCE_X)
        );

        const platform = platforms.create(posX, posY, 'platform');
        platform.setDisplaySize(50, 20); // Set the width to 50 and height to 20
        platform.refreshBody(); // Refresh the physics body to match the new size

        lastPlatformY = posY;
        lastPlatformX = posX;
    }
}
