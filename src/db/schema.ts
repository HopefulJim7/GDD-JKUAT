import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  preferredPace: text('preferred_pace'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  createdById: integer('created_by_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  distanceKm: doublePrecision('distance_km').notNull(),
  difficulty: text('difficulty').notNull(),
  startLocation: text('start_location').notNull(),
  terrain: text('terrain').notNull().default('Paved'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  organizerId: integer('organizer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  routeId: integer('route_id').references(() => routes.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  runDate: text('run_date').notNull(),
  startTime: text('start_time').notNull(),
  meetingPoint: text('meeting_point').notNull(),
  distanceKm: doublePrecision('distance_km').notNull(),
  paceLabel: text('pace_label').notNull(),
  runType: text('run_type').notNull(),
  terrain: text('terrain').notNull(),
  elevationGainM: integer('elevation_gain_m').notNull().default(0),
  maxParticipants: integer('max_participants').notNull().default(24),
  routeNotes: text('route_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rsvps = pgTable(
  'rsvps',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status').notNull().default('going'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('rsvps_run_user_idx').on(table.runId, table.userId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  organizedRuns: many(runs),
  savedRoutes: many(routes),
  rsvps: many(rsvps),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  creator: one(users, {
    fields: [routes.createdById],
    references: [users.id],
  }),
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  organizer: one(users, {
    fields: [runs.organizerId],
    references: [users.id],
  }),
  route: one(routes, {
    fields: [runs.routeId],
    references: [routes.id],
  }),
  rsvps: many(rsvps),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  run: one(runs, {
    fields: [rsvps.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
  }),
}));
