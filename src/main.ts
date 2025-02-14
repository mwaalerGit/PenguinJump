import Phaser from 'phaser';

type Platform = Phaser.Physics.Arcade.StaticGroup;
type Player = Phaser.Physics.Arcade.Sprite;

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
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
    this.load.image('platform', './assests/platform.jpg');
    this.load.image('penguin', './assests/penguinSpriteIdle.png');
}

// function preload(this: Phaser.Scene): void {
//     this.load.image('background', '/assets/background.jpg')
//         .on('loaderror', (file: Phaser.Loader.File) => {
//             console.error('Failed to load image:', file.key);
//         });
//     this.load.image('platform', '/assets/platform.png')
//         .on('loaderror', (file: Phaser.Loader.File) => {
//             console.error('Failed to load image:', file.key);
//         });
//     this.load.image('penguin', '/assets/penguinSpriteIdle.png')
//         .on('loaderror', (file: Phaser.Loader.File) => {
//             console.error('Failed to load image:', file.key);
//         });
// }

function create(this: Phaser.Scene): void {
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background').setOrigin(0.5, 0.5);

    platforms = this.physics.add.staticGroup();
    generatePlatforms(this);

    player = this.physics.add.sprite(200, 500, 'penguin');
    player.setCollideWorldBounds(true);
    player.setBounce(0.3);

    this.physics.add.collider(player, platforms);

    cursors = this.input?.keyboard?.createCursorKeys() as CursorKeys;

    // Enable camera follow
    this.cameras.main.startFollow(player, true, 0.05, 0.05);
    this.cameras.main.setLerp(0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 400, 600);
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
    const platformCount = 10;
    const minDistanceY = 50;
    const maxDistanceY = 100;
    const minDistanceX = 50;
    const maxDistanceX = 200;

    let lastPlatformY = 600;
    let lastPlatformX = 200;

    for (let i = 0; i < platformCount; i++) {
        const posY = lastPlatformY - Phaser.Math.Between(minDistanceY, maxDistanceY);
        const posX = Phaser.Math.Between(
            Math.max(50, lastPlatformX - maxDistanceX),
            Math.min(350, lastPlatformX + maxDistanceX)
        );

        const platform = platforms.create(posX, posY, 'platform');
        platform.setDisplaySize(50, 20); // Set the width to 50 and height to 20
        platform.refreshBody(); // Refresh the physics body to match the new size

        lastPlatformY = posY;
        lastPlatformX = posX;
    }
}
