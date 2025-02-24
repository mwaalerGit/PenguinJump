import { Player, CursorKeys, Platforms as PlatformGroup, ScoreText, MovingPlatforms as MovingPlatformGroup } from "./utils";

export type GameState = {
  player: Player;
  cursors: CursorKeys;
  platformGroup: PlatformGroup;
  movingPlatformGroup: MovingPlatformGroup;
  bottomPlatformGroup: PlatformGroup;
  scoreText: ScoreText;
  score: number;
  hasJumped: boolean;
};

export let state: GameState;

export const initState = (init: GameState) => {
  state = init;
};
