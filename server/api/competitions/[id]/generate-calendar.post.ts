import { db } from '../../../database/db';
import { teams, matches, competitions } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));

  const comp = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!comp.length) {
    throw createError({ statusCode: 404, statusMessage: 'Competition not found' });
  }

  if (comp[0].calendarMode === 'manual') {
    throw createError({ statusCode: 400, statusMessage: 'Questa arena usa il calendario manuale' });
  }

  const existingMatches = await db.select({ id: matches.id })
    .from(matches)
    .where(eq(matches.competitionId, competitionId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Il calendario è già stato generato' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));

  if (compTeams.length < 2 || compTeams.length % 2 !== 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Serve un numero pari di squadre (minimo 2) per generare il calendario',
    });
  }

  await db.update(competitions).set({ calendarMode: 'auto' }).where(eq(competitions.id, competitionId));

  // Round-robin circle method
  const n = compTeams.length;
  const teamIds = compTeams.map(t => t.id);
  const fixed = teamIds[0];
  const rotating = teamIds.slice(1);

  const matchesToInsert: Array<{
    team1Id: number;
    team2Id: number;
    matchday: number;
    competitionId: number;
  }> = [];

  for (let round = 0; round < n - 1; round++) {
    const current = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      matchesToInsert.push({
        team1Id: current[i]!,
        team2Id: current[n - 1 - i]!,
        matchday: round + 1,
        competitionId,
      });
    }
    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!);
  }

  await db.insert(matches).values(matchesToInsert);

  return await db.select().from(matches).where(eq(matches.competitionId, competitionId));
});
