import type { Status } from './status';

export type Ticket = {
    id: string;
    statuses?: (Status)[];
    tags?: (string)[];
  };
