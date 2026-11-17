import { and, asc, eq, gte } from 'drizzle-orm';
import { db } from './index.ts';
import { routes, rsvps, runs, users } from './schema.ts';

export interface CreateRunInput {
  organizerId: number;
  routeId?: number | null;
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceLabel: string;
  runType: string;
  terrain: string;
  elevationGainM: number;
  maxParticipants: number;
  routeNotes?: string | null;
}

export interface UpdateRunInput {
  routeId?: number | null;
  title?: string;
  description?: string;
  runDate?: string;
  startTime?: string;
  meetingPoint?: string;
  distanceKm?: number;
  paceLabel?: string;
  runType?: string;
  terrain?: string;
  elevationGainM?: number;
  maxParticipants?: number;
  routeNotes?: string | null;
}

export interface RunListFilters {
  runType?: string;
  terrain?: string;
  currentUserId?: number | null;
}

export interface PublicParticipant {
  id: number;
  displayName: string;
  preferredPace: string | null;
}

export interface RunSummary {
  id: number;
  routeId: number | null;
  routeTitle: string | null;
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceLabel: string;
  runType: string;
  terrain: string;
  elevationGainM: number;
  maxParticipants: number;
  routeNotes: string | null;
  createdAt: Date;
  organizer: {
    id: number;
    displayName: string;
    preferredPace: string | null;
  };
  participantCount: number;
  participants: PublicParticipant[];
  isJoined: boolean;
  isOrganizer: boolean;
}

export async function listUpcomingRuns(
  filters: RunListFilters = {},
): Promise<RunSummary[]> {
  try {
    const todayIso = new Date().toISOString().slice(0, 10);

    const conditions = [gte(runs.runDate, todayIso)];
    if (filters.runType && filters.runType !== 'All') {
      conditions.push(eq(runs.runType, filters.runType));
    }
    if (filters.terrain && filters.terrain !== 'All') {
      conditions.push(eq(runs.terrain, filters.terrain));
    }

    const runRows = await db
      .select({
        id: runs.id,
        routeId: runs.routeId,
        routeTitle: routes.title,
        title: runs.title,
        description: runs.description,
        runDate: runs.runDate,
        startTime: runs.startTime,
        meetingPoint: runs.meetingPoint,
        distanceKm: runs.distanceKm,
        paceLabel: runs.paceLabel,
        runType: runs.runType,
        terrain: runs.terrain,
        elevationGainM: runs.elevationGainM,
        maxParticipants: runs.maxParticipants,
        routeNotes: runs.routeNotes,
        createdAt: runs.createdAt,
        organizerId: users.id,
        organizerName: users.displayName,
        organizerPace: users.preferredPace,
      })
      .from(runs)
      .innerJoin(users, eq(runs.organizerId, users.id))
      .leftJoin(routes, eq(runs.routeId, routes.id))
      .where(and(...conditions))
      .orderBy(asc(runs.runDate), asc(runs.startTime));

    const rsvpRows = await db
      .select({
        runId: rsvps.runId,
        userId: users.id,
        displayName: users.displayName,
        preferredPace: users.preferredPace,
      })
      .from(rsvps)
      .innerJoin(users, eq(rsvps.userId, users.id));

    const rsvpByRun = new Map<number, PublicParticipant[]>();
    for (const row of rsvpRows) {
      const list = rsvpByRun.get(row.runId) ?? [];
      list.push({
        id: row.userId,
        displayName: row.displayName,
        preferredPace: row.preferredPace,
      });
      rsvpByRun.set(row.runId, list);
    }

    return runRows.map((row) => {
      const participants = rsvpByRun.get(row.id) ?? [];
      const currentUserId = filters.currentUserId ?? null;
      return {
        id: row.id,
        routeId: row.routeId ?? null,
        routeTitle: row.routeTitle ?? null,
        title: row.title,
        description: row.description,
        runDate: row.runDate,
        startTime: row.startTime,
        meetingPoint: row.meetingPoint,
        distanceKm: row.distanceKm,
        paceLabel: row.paceLabel,
        runType: row.runType,
        terrain: row.terrain,
        elevationGainM: row.elevationGainM,
        maxParticipants: row.maxParticipants,
        routeNotes: row.routeNotes,
        createdAt: row.createdAt,
        organizer: {
          id: row.organizerId,
          displayName: row.organizerName,
          preferredPace: row.organizerPace,
        },
        participantCount: participants.length,
        participants,
        isJoined:
          currentUserId !== null &&
          participants.some((p) => p.id === currentUserId),
        isOrganizer:
          currentUserId !== null && row.organizerId === currentUserId,
      };
    });
  } catch (error) {
    console.error('Failed to list upcoming runs:', error);
    throw new Error('Unable to load upcoming club runs.', { cause: error });
  }
}

export async function createRun(input: CreateRunInput) {
  try {
    const inserted = await db
      .insert(runs)
      .values({
        organizerId: input.organizerId,
        routeId: input.routeId ?? null,
        title: input.title,
        description: input.description,
        runDate: input.runDate,
        startTime: input.startTime,
        meetingPoint: input.meetingPoint,
        distanceKm: input.distanceKm,
        paceLabel: input.paceLabel,
        runType: input.runType,
        terrain: input.terrain,
        elevationGainM: input.elevationGainM,
        maxParticipants: input.maxParticipants,
        routeNotes: input.routeNotes ?? null,
      })
      .returning();

    const createdRun = inserted[0];

    await db
      .insert(rsvps)
      .values({
        runId: createdRun.id,
        userId: input.organizerId,
        status: 'going',
      })
      .onConflictDoNothing();

    return createdRun;
  } catch (error) {
    console.error('Failed to create run:', error);
    throw new Error('Unable to post the upcoming run.', { cause: error });
  }
}

export async function updateRun(
  runId: number,
  organizerId: number,
  updates: UpdateRunInput,
) {
  try {
    const existing = await db
      .select()
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);

    if (!existing[0]) {
      return { status: 'not_found' as const };
    }
    if (existing[0].organizerId !== organizerId) {
      return { status: 'forbidden' as const };
    }

    const updated = await db
      .update(runs)
      .set(updates)
      .where(and(eq(runs.id, runId), eq(runs.organizerId, organizerId)))
      .returning();

    return { status: 'updated' as const, run: updated[0] };
  } catch (error) {
    console.error('Failed to update run:', error);
    throw new Error('Unable to update this run.', { cause: error });
  }
}

export async function deleteRun(runId: number, organizerId: number) {
  try {
    const existing = await db
      .select()
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);

    if (!existing[0]) {
      return { status: 'not_found' as const };
    }
    if (existing[0].organizerId !== organizerId) {
      return { status: 'forbidden' as const };
    }

    await db
      .delete(runs)
      .where(and(eq(runs.id, runId), eq(runs.organizerId, organizerId)));

    return { status: 'deleted' as const };
  } catch (error) {
    console.error('Failed to delete run:', error);
    throw new Error('Unable to cancel this run.', { cause: error });
  }
}

export async function joinRun(runId: number, userId: number) {
  try {
    const runRows = await db
      .select()
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);

    const targetRun = runRows[0];
    if (!targetRun) {
      return { status: 'not_found' as const };
    }

    const currentRsvps = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.runId, runId));

    const alreadyJoined = currentRsvps.some((r) => r.userId === userId);
    if (alreadyJoined) {
      return { status: 'joined' as const };
    }

    if (currentRsvps.length >= targetRun.maxParticipants) {
      return { status: 'full' as const };
    }

    await db
      .insert(rsvps)
      .values({
        runId,
        userId,
        status: 'going',
      })
      .onConflictDoNothing();

    return { status: 'joined' as const };
  } catch (error) {
    console.error('Failed to RSVP to run:', error);
    throw new Error('Unable to join this run.', { cause: error });
  }
}

export async function leaveRun(runId: number, userId: number) {
  try {
    await db
      .delete(rsvps)
      .where(and(eq(rsvps.runId, runId), eq(rsvps.userId, userId)));

    return { status: 'left' as const };
  } catch (error) {
    console.error('Failed to cancel RSVP:', error);
    throw new Error('Unable to leave this run.', { cause: error });
  }
}
