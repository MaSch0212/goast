export type Status = ('open') | ('in-progress') | ('closed');

/**
 * All possible values of the enum `Status`.
 */
export const STATUS_VALUES = ['open', 'in-progress', 'closed'] as const;
