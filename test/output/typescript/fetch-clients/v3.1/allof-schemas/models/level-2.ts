import type { Level1 } from './level-1';

export type Level2 = (Level1) & ({
      level2Value?: string;
    });
