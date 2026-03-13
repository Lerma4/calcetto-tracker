import { db } from '../../../database/db';
import { teams, matches, competitions } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');
  const body = await readBody(event);

  if (!body.team1Id || !body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'team1Id e team2Id sono richiesti' });
  }

  if (body.team1Id === body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'Le due squadre devono essere diverse' });
  }

  const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
  if (!comp) {
    throw createError({ statusCode: 404, statusMessage: 'Arena non trovata' });
  }

  if (comp.calendarMode === 'auto') {
    throw createError({ statusCode: 400, statusMessage: 'Questa arena usa il calendario automatico' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));
  const teamIds = new Set(compTeams.map(t => t.id));
  if (!teamIds.has(body.team1Id) || !teamIds.has(body.team2Id)) {
    throw createError({ statusCode: 400, statusMessage: 'Le squadre devono appartenere a questa arena' });
  }

  const allMatches = await db.select().from(matches).where(eq(matches.competitionId, competitionId));
  const duplicateMatch = allMatches.find(
    m => (m.team1Id === body.team1Id && m.team2Id === body.team2Id) ||
         (m.team1Id === body.team2Id && m.team2Id === body.team1Id)
  );
  if (duplicateMatch) {
    throw createError({ statusCode: 400, statusMessage: 'Questa coppia di squadre ha già una partita in calendario' });
  }

  const maxMatchday = allMatches.reduce((max, m) => Math.max(max, m.matchday), 0);
  const matchesPerDay = compTeams.length / 2;
  const currentDayMatches = allMatches.filter(m => m.matchday === maxMatchday);

  let matchday: number;
  if (maxMatchday === 0 || currentDayMatches.length >= matchesPerDay) {
    matchday = maxMatchday + 1;
  } else {
    matchday = maxMatchday;
  }

  const dayMatches = allMatches.filter(m => m.matchday === matchday);
  for (const tId of [body.team1Id, body.team2Id]) {
    const alreadyPlays = dayMatches.find(m => m.team1Id === tId || m.team2Id === tId);
    if (alreadyPlays) {
      const team = compTeams.find(t => t.id === tId);
      throw createError({
        statusCode: 400,
        statusMessage: `La squadra ${team?.name || tId} gioca già nella giornata ${matchday}`,
      });
    }
  }

  if (!comp.calendarMode) {
    await db.update(competitions)
      .set({ calendarMode: 'manual' })
      .where(eq(competitions.id, competitionId));
  }

  const [newMatch] = await db.insert(matches).values({
    team1Id: body.team1Id,
    team2Id: body.team2Id,
    matchday,
    competitionId,
  }).returning();

  return newMatch;
});
