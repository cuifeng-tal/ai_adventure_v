
export enum GameState {
  INITIAL = 'INITIAL',
  LEVEL_1 = 'LEVEL_1',
  LEVEL_1_FEEDBACK = 'LEVEL_1_FEEDBACK',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_2_FEEDBACK = 'LEVEL_2_FEEDBACK',
  FINAL_REWARD = 'FINAL_REWARD'
}

export enum Difficulty {
  EASY = '简单',
  MEDIUM = '普通',
  HARD = '困难'
}

export interface GameContext {
  initialQuestion: string;
  l1Story: string;
  l1Question: string;
  l1Answer: string;
  l1Image: string;
  l1FailCount: number;
  difficulty: Difficulty;
  l2Story: string;
  l2Question: string;
  l2Answer: string;
  l2Image: string;
  isAudioPlaying: boolean;
}

export interface AbilityModel {
  mastery: number;
  logic: number;
  advice: string;
}
