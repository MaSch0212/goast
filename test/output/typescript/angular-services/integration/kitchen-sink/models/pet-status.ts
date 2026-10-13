export type PetStatus = ('available') | ('pending') | ('sold');

/**
 * All possible values of the enum `PetStatus`.
 */
export const PET_STATUS_VALUES = ['available', 'pending', 'sold'] as const;
