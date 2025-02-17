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
    this.load.image('platformRed', '/assests/platformRed.png');
    this.load.image('penguin', '/assests/penguinSpriteIdle.png');
    this.load.spritesheet('penguinWalk', '/assests/penguinWalk.png', { frameWidth: 32, frameHeight: 32 });
}

function create(this: Phaser.Scene): void {
    // Add background image
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background').setOrigin(0.5, 0.5);

    // Add platforms
    platforms = this.physics.add.staticGroup();
    generatePlatforms(this);

    // Add player
    player = this.physics.add.sprite(200, MAP_HEIGHT-200, 'penguin'); // Start the player near the bottom of the map
    player.setCollideWorldBounds(true);
    player.setBounce(0.0);
    this.physics.add.collider(player, platforms);

    // Add lava
    const redPlatforms = this.physics.add.staticGroup();
    const lava = redPlatforms.create(200, MAP_HEIGHT, 'platformRed');
    lava.setDisplaySize(GAME_WIDTH, 20); // Set the width to 400 and height to 20
    lava.refreshBody(); // Refresh the physics body to match the new size

    // Add collision between player and lava
    this.physics.add.collider(player, redPlatforms, () => {
        this.physics.pause(); // Pause the physics engine
        player.setTint(0xff0000); // Change the player's color to red
        // Add a restart button
        const restartButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Restart', { fontSize: '32px', color: '#000' });
        restartButton.setOrigin(0.5, 0.5);
        restartButton.setInteractive(); // Allow the button to be clicked
        restartButton.on('pointerdown', () => {
            this.scene.restart(); // Restart the scene
        }
        );
    });
    

    // Add cursor keys
    cursors = this.input?.keyboard?.createCursorKeys() as CursorKeys;    

    // Set camera to follow the player
    this.cameras.main.startFollow(player, true);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Match the camera bounds to the world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, MAP_HEIGHT); // Extend the world bounds to allow upward movement

    // Add animations
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('penguinWalk', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
}

function update(this: Phaser.Scene): void {
    if (cursors.left?.isDown) {
        player.setVelocityX(-160);
        player.anims.play('walk', true);
    } else if (cursors.right?.isDown) {
        player.setVelocityX(160);
        player.anims.play('walk', true);
    } else {
        player.anims.play('walk', false);
        player.setVelocityX(0);
    }
    
    if ((cursors.space?.isDown || cursors.up?.isDown) && player?.body?.blocked.down) {
        player.setVelocityY(-250);
    }

    // Move camera upwards if player jumps higher
    if (player.y < this.cameras.main.scrollY + 200) {
        this.cameras.main.scrollY = player.y - 200;
    }

    // Check if the player has fallen below the visible screen area
    if (player.y >= GAME_HEIGHT+10) {
        this.scene.restart(); // Restart the scene
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

    // Generate platforms with static positions 
    const fixedPositions = [
        { x: 100, y: 400 },
        { x: 250, y: 300 },
        { x: 350, y: 200 },
    ];

    fixedPositions.forEach(pos => {
        const platform = platforms.create(pos.x, pos.y, 'platform');
        platform.setDisplaySize(100, 20); // Set the width to 100 and height to 20
        platform.refreshBody(); // Refresh the physics body to match the new size
    });


    // for (let i = 1; i < PLATFORM_COUNT; i++) {
    //     const posY = lastPlatformY - Phaser.Math.Between(MIN_DISTANCE_Y, MAX_DISTANCE_Y);
    //     const posX = Phaser.Math.Between(
    //         Math.max(50, lastPlatformX - MAX_DISTANCE_X),
    //         Math.min(350, lastPlatformX + MAX_DISTANCE_X)
    //     );

    //     const platform = platforms.create(posX, posY, 'platform');
    //     platform.setDisplaySize(50, 20); // Set the width to 50 and height to 20
    //     platform.refreshBody(); // Refresh the physics body to match the new size

    //     lastPlatformY = posY;
    //     lastPlatformX = posX;
    // }
}
