import type { Level2 } from './level-2';

export type Level3 = (Level2) & ({
      level3Value?: string;
    });
