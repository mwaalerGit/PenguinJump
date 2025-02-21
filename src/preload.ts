export function preload(this: Phaser.Scene) {
  this.load.image("background", "/assests/background.jpg");
  this.load.image("platform", "/assests/tundraCenter.png");
  this.load.image("platform2", "/assests/tundraCenter.png");
  this.load.image("platformRed", "/assests/platformRed.png");
  this.load.image("penguin", "/assests/penguinSpriteIdle.png");
  this.load.spritesheet("penguinWalk", "/assests/penguinWalk.png", { frameWidth: 32, frameHeight: 32 });
}
