import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { routes, users } from './schema.ts';

export interface CreateRouteInput {
  createdById: number;
  title: string;
  distanceKm: number;
  difficulty: string;
  startLocation: string;
  terrain: string;
  notes?: string | null;
}

export interface SavedRouteSummary {
  id: number;
  title: string;
  distanceKm: number;
  difficulty: string;
  startLocation: string;
  terrain: string;
  notes: string | null;
  createdAt: Date;
  createdBy: {
    id: number;
    displayName: string;
  };
  isOwner: boolean;
}

export async function listSavedRoutes(
  currentUserId: number | null = null,
): Promise<SavedRouteSummary[]> {
  try {
    const rows = await db
      .select({
        id: routes.id,
        title: routes.title,
        distanceKm: routes.distanceKm,
        difficulty: routes.difficulty,
        startLocation: routes.startLocation,
        terrain: routes.terrain,
        notes: routes.notes,
        createdAt: routes.createdAt,
        creatorId: users.id,
        creatorName: users.displayName,
      })
      .from(routes)
      .innerJoin(users, eq(routes.createdById, users.id))
      .orderBy(desc(routes.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      distanceKm: row.distanceKm,
      difficulty: row.difficulty,
      startLocation: row.startLocation,
      terrain: row.terrain,
      notes: row.notes,
      createdAt: row.createdAt,
      createdBy: {
        id: row.creatorId,
        displayName: row.creatorName,
      },
      isOwner: currentUserId !== null && row.creatorId === currentUserId,
    }));
  } catch (error) {
    console.error('Failed to list saved routes:', error);
    throw new Error('Unable to load the club route library.', { cause: error });
  }
}

export async function createSavedRoute(input: CreateRouteInput) {
  try {
    const inserted = await db
      .insert(routes)
      .values({
        createdById: input.createdById,
        title: input.title,
        distanceKm: input.distanceKm,
        difficulty: input.difficulty,
        startLocation: input.startLocation,
        terrain: input.terrain,
        notes: input.notes ?? null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to save route:', error);
    throw new Error('Unable to save route to the library.', { cause: error });
  }
}

export async function deleteSavedRoute(routeId: number, userId: number) {
  try {
    const existing = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);

    if (!existing[0]) {
      return { status: 'not_found' as const };
    }
    if (existing[0].createdById !== userId) {
      return { status: 'forbidden' as const };
    }

    await db
      .delete(routes)
      .where(and(eq(routes.id, routeId), eq(routes.createdById, userId)));

    return { status: 'deleted' as const };
  } catch (error) {
    console.error('Failed to delete route:', error);
    throw new Error('Unable to remove this route.', { cause: error });
  }
}

export async function routeExists(routeId: number): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: routes.id })
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);
    return Boolean(rows[0]);
  } catch (error) {
    console.error('Failed to check route existence:', error);
    throw new Error('Unable to verify selected route.', { cause: error });
  }
}
