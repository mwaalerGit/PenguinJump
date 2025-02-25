export interface ScoreEntry {
    username: string;
    score: number;
    timestamp: number;
}

export interface PlatformConfig {
  width: number;
  height: number;
  texture: string;
}

export enum PlatformType {
  NORMAL = 'normal',
  MOVING = 'moving',
  ICE = 'ice'
}

export const PLATFORM_WEIGHTS = {
  [PlatformType.NORMAL]: 60,
  [PlatformType.MOVING]: 100,
  [PlatformType.ICE]: 20
};

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  [PlatformType.NORMAL]: { width: 100, height: 20, texture: 'platform' },
  [PlatformType.MOVING]: { width: 70, height: 20, texture: 'platformRed' },
  [PlatformType.ICE]: { width: 100, height: 20, texture: 'platformIce' }
};