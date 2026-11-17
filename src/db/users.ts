import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export interface UpsertUserInput {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export async function getOrCreateUser(input: UpsertUserInput) {
  try {
    const safeName =
      input.displayName.trim() || input.email.split('@')[0] || 'Club Member';

    const result = await db
      .insert(users)
      .values({
        uid: input.uid,
        email: input.email,
        displayName: safeName,
        avatarUrl: input.avatarUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: input.email,
          avatarUrl: input.avatarUrl ?? null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Unable to synchronize member profile.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error('Failed to look up user by UID:', error);
    throw new Error('Unable to load member profile.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  updates: { displayName?: string; preferredPace?: string | null },
) {
  try {
    const payload: { displayName?: string; preferredPace?: string | null } = {};
    if (updates.displayName !== undefined) {
      payload.displayName = updates.displayName.trim();
    }
    if (updates.preferredPace !== undefined) {
      payload.preferredPace = updates.preferredPace?.trim() || null;
    }

    const result = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, userId))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw new Error('Unable to update member profile.', { cause: error });
  }
}
