export const VOTE_TYPES = ['VALID', 'BLANK', 'NULL'] as const;

export type VoteType = (typeof VOTE_TYPES)[number];
