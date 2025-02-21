export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const MAP_HEIGHT = 600;
export const MAX_SCORE = MAP_HEIGHT / 10;

export type Platforms = Phaser.Physics.Arcade.StaticGroup;
export type Player = Phaser.Physics.Arcade.Sprite;
export type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
export type MovingPlatforms = Phaser.Physics.Arcade.Group;
export type ScoreText = Phaser.GameObjects.Text;
