import { z } from 'zod';

export const MatchUpdateSchema = z.object({
    matchId: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    runs: z.number().min(0),
    wickets: z.number().min(0).max(10),
    over: z.number().min(0),
    ball_in_over: z.number().min(1).max(6),
    runs_in_over: z.number().default(0),
    isOverComplete: z.boolean(),
    status: z.enum(['LIVE', 'COMPLETED']).default('LIVE'),
    timestamp: z.number(),
});

export type MatchUpdate = z.infer<typeof MatchUpdateSchema>;

export interface VotePayload {
    pollId: string;
    optionIndex: number;
    userId: string;
    roomId: string;
}