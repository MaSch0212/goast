export type Permission = ('read') | ('write') | ('delete');

/**
 * All possible values of the enum `Permission`.
 */
export const PERMISSION_VALUES = ['read', 'write', 'delete'] as const;
