import { db } from '../../../../database/db';
import { teams, matches } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { broadcastCompetitionUpdate } from '../../../../utils/ws';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');
  const matchId = requireIntParam(event, 'matchId');
  const body = await readBody(event);

  if (!body.team1Id || !body.team2Id) {
    throw createError({ statusCode: 400, message: 'team1Id e team2Id sono richiesti' });
  }

  if (body.team1Id === body.team2Id) {
    throw createError({ statusCode: 400, message: 'Le due squadre devono essere diverse' });
  }

  const [currentMatch] = await db.select().from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.competitionId, competitionId)));

  if (!currentMatch) {
    throw createError({ statusCode: 404, message: 'Partita non trovata' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));
  const teamIds = new Set(compTeams.map(t => t.id));
  if (!teamIds.has(body.team1Id) || !teamIds.has(body.team2Id)) {
    throw createError({ statusCode: 400, message: 'Le squadre devono appartenere a questa arena' });
  }

  const allMatches = await db.select().from(matches).where(eq(matches.competitionId, competitionId));
  const duplicateMatch = allMatches.find(
    m => m.id !== matchId &&
      ((m.team1Id === body.team1Id && m.team2Id === body.team2Id) ||
       (m.team1Id === body.team2Id && m.team2Id === body.team1Id))
  );
  if (duplicateMatch) {
    throw createError({ statusCode: 400, message: 'Questa coppia di squadre ha già una partita in calendario' });
  }

  const dayMatches = allMatches.filter(m => m.matchday === currentMatch.matchday && m.id !== matchId);
  for (const tId of [body.team1Id, body.team2Id]) {
    const alreadyPlays = dayMatches.find(m => m.team1Id === tId || m.team2Id === tId);
    if (alreadyPlays) {
      const team = compTeams.find(t => t.id === tId);
      throw createError({
        statusCode: 400,
        message: `La squadra ${team?.name || tId} gioca già nella giornata ${currentMatch.matchday}`,
      });
    }
  }

  const [updated] = await db.update(matches)
    .set({ team1Id: body.team1Id, team2Id: body.team2Id })
    .where(eq(matches.id, matchId))
    .returning();

  if (updated) {
    broadcastCompetitionUpdate(competitionId);
  }

  return updated;
});
