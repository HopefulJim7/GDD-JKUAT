import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  createSavedRoute,
  deleteSavedRoute,
  listSavedRoutes,
  routeExists,
} from './src/db/routes.ts';
import {
  createRun,
  deleteRun,
  joinRun,
  leaveRun,
  listUpcomingRuns,
  updateRun,
} from './src/db/runs.ts';
import { updateUserProfile } from './src/db/users.ts';
import { optionalAuth, requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_RUN_TYPES = ['Tempo', 'Recovery', 'Long Run', 'Trail', 'Track'];
const ALLOWED_TERRAINS = ['Paved', 'Trail', 'Track', 'Mixed'];
const ALLOWED_DIFFICULTIES = ['Easy', 'Moderate', 'Challenging', 'Hard'];

function parsePositiveId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function validateRouteBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const difficulty =
    typeof body.difficulty === 'string' ? body.difficulty.trim() : '';
  const startLocation =
    typeof body.startLocation === 'string' ? body.startLocation.trim() : '';
  const terrain =
    typeof body.terrain === 'string' && body.terrain.trim()
      ? body.terrain.trim()
      : 'Paved';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : null;
  const distanceKm = Number(body.distanceKm);

  if (!title || title.length < 3 || title.length > 90) {
    return { error: 'Route title must be between 3 and 90 characters.' };
  }
  if (!Number.isFinite(distanceKm) || distanceKm < 1 || distanceKm > 100) {
    return { error: 'Distance must be between 1 and 100 km.' };
  }
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    return { error: 'Select a valid difficulty level.' };
  }
  if (!startLocation || startLocation.length < 3 || startLocation.length > 140) {
    return { error: 'Start location must be between 3 and 140 characters.' };
  }
  if (!ALLOWED_TERRAINS.includes(terrain)) {
    return { error: 'Select a valid terrain type.' };
  }

  return {
    data: {
      title,
      distanceKm: Math.round(distanceKm * 10) / 10,
      difficulty,
      startLocation,
      terrain,
      notes: notes || null,
    },
  };
}

function validateRunBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const runDate = typeof body.runDate === 'string' ? body.runDate.trim() : '';
  const startTime =
    typeof body.startTime === 'string' ? body.startTime.trim() : '';
  const meetingPoint =
    typeof body.meetingPoint === 'string' ? body.meetingPoint.trim() : '';
  const paceLabel =
    typeof body.paceLabel === 'string' ? body.paceLabel.trim() : '';
  const runType = typeof body.runType === 'string' ? body.runType.trim() : '';
  const terrain = typeof body.terrain === 'string' ? body.terrain.trim() : '';
  const routeNotes =
    typeof body.routeNotes === 'string' ? body.routeNotes.trim() : null;

  let routeId: number | null = null;
  if (
    body.routeId !== undefined &&
    body.routeId !== null &&
    body.routeId !== ''
  ) {
    const parsedRouteId = Number(body.routeId);
    if (!Number.isInteger(parsedRouteId) || parsedRouteId <= 0) {
      return { error: 'Invalid route selection.' };
    }
    routeId = parsedRouteId;
  }

  const distanceKm = Number(body.distanceKm);
  const elevationGainM =
    body.elevationGainM !== undefined ? Number(body.elevationGainM) : 0;
  const maxParticipants =
    body.maxParticipants !== undefined ? Number(body.maxParticipants) : 24;

  if (!title || title.length < 3 || title.length > 90) {
    return { error: 'Run title must be between 3 and 90 characters.' };
  }
  if (!description || description.length < 10 || description.length > 600) {
    return { error: 'Description must be between 10 and 600 characters.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    return { error: 'Run date must be formatted as YYYY-MM-DD.' };
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return { error: 'Start time must be formatted as HH:MM.' };
  }
  if (!meetingPoint || meetingPoint.length < 3 || meetingPoint.length > 140) {
    return { error: 'Meeting point must be between 3 and 140 characters.' };
  }
  if (!Number.isFinite(distanceKm) || distanceKm < 1 || distanceKm > 100) {
    return { error: 'Distance must be between 1 and 100 km.' };
  }
  if (!paceLabel || paceLabel.length > 32) {
    return { error: 'Target pace is required.' };
  }
  if (!ALLOWED_RUN_TYPES.includes(runType)) {
    return { error: 'Select a valid run type.' };
  }
  if (!ALLOWED_TERRAINS.includes(terrain)) {
    return { error: 'Select a valid terrain type.' };
  }
  if (
    !Number.isFinite(elevationGainM) ||
    elevationGainM < 0 ||
    elevationGainM > 5000
  ) {
    return { error: 'Elevation gain must be between 0 and 5000 meters.' };
  }
  if (
    !Number.isFinite(maxParticipants) ||
    maxParticipants < 2 ||
    maxParticipants > 200
  ) {
    return { error: 'Max participants must be between 2 and 200.' };
  }

  return {
    data: {
      routeId,
      title,
      description,
      runDate,
      startTime,
      meetingPoint,
      distanceKm: Math.round(distanceKm * 10) / 10,
      paceLabel,
      runType,
      terrain,
      elevationGainM: Math.round(elevationGainM),
      maxParticipants: Math.round(maxParticipants),
      routeNotes: routeNotes || null,
    },
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/routes', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const savedRoutes = await listSavedRoutes(req.dbUser?.id ?? null);
      res.json({ routes: savedRoutes });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load saved routes.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/routes', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validation = validateRouteBody(req.body ?? {});
      if ('error' in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const created = await createSavedRoute({
        createdById: req.dbUser.id,
        ...validation.data,
      });

      res.status(201).json({ route: created });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save route.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/routes/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const routeId = parsePositiveId(String(req.params.id));
      if (!routeId) {
        return res.status(400).json({ error: 'Invalid route identifier.' });
      }

      const result = await deleteSavedRoute(routeId, req.dbUser.id);
      if (result.status === 'not_found') {
        return res.status(404).json({ error: 'Route not found.' });
      }
      if (result.status === 'forbidden') {
        return res
          .status(403)
          .json({ error: 'Only the route creator can remove it.' });
      }

      res.json({ deleted: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete route.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/runs', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const runType =
        typeof req.query.type === 'string' ? req.query.type : undefined;
      const terrain =
        typeof req.query.terrain === 'string' ? req.query.terrain : undefined;

      const upcoming = await listUpcomingRuns({
        runType,
        terrain,
        currentUserId: req.dbUser?.id ?? null,
      });

      res.json({ runs: upcoming });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load upcoming runs.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validation = validateRunBody(req.body ?? {});
      if ('error' in validation) {
        return res.status(400).json({ error: validation.error });
      }

      if (validation.data.routeId !== null) {
        const exists = await routeExists(validation.data.routeId);
        if (!exists) {
          return res
            .status(400)
            .json({ error: 'Selected library route no longer exists.' });
        }
      }

      const created = await createRun({
        organizerId: req.dbUser.id,
        ...validation.data,
      });

      res.status(201).json({ run: created });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to post run.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const runId = parsePositiveId(String(req.params.id));
      if (!runId) {
        return res.status(400).json({ error: 'Invalid run identifier.' });
      }

      const validation = validateRunBody(req.body ?? {});
      if ('error' in validation) {
        return res.status(400).json({ error: validation.error });
      }

      if (validation.data.routeId !== null) {
        const exists = await routeExists(validation.data.routeId);
        if (!exists) {
          return res
            .status(400)
            .json({ error: 'Selected library route no longer exists.' });
        }
      }

      const result = await updateRun(runId, req.dbUser.id, validation.data);
      if (result.status === 'not_found') {
        return res.status(404).json({ error: 'Run not found.' });
      }
      if (result.status === 'forbidden') {
        return res
          .status(403)
          .json({ error: 'Only the run organizer can edit this session.' });
      }

      res.json({ run: result.run });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update run.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const runId = parsePositiveId(String(req.params.id));
      if (!runId) {
        return res.status(400).json({ error: 'Invalid run identifier.' });
      }

      const result = await deleteRun(runId, req.dbUser.id);
      if (result.status === 'not_found') {
        return res.status(404).json({ error: 'Run not found.' });
      }
      if (result.status === 'forbidden') {
        return res
          .status(403)
          .json({ error: 'Only the run organizer can cancel this session.' });
      }

      res.json({ deleted: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to cancel run.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const runId = parsePositiveId(String(req.params.id));
      if (!runId) {
        return res.status(400).json({ error: 'Invalid run identifier.' });
      }

      const result = await joinRun(runId, req.dbUser.id);
      if (result.status === 'not_found') {
        return res.status(404).json({ error: 'Run not found.' });
      }
      if (result.status === 'full') {
        return res
          .status(409)
          .json({ error: 'This run has reached its participant cap.' });
      }

      res.json({ joined: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join run.';
      res.status(500).json({ error: message });
    }
  });

  app.delete(
    '/api/runs/:id/rsvp',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        if (!req.dbUser) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const runId = parsePositiveId(String(req.params.id));
        if (!runId) {
          return res.status(400).json({ error: 'Invalid run identifier.' });
        }

        await leaveRun(runId, req.dbUser.id);
        res.json({ joined: false });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to leave run.';
        res.status(500).json({ error: message });
      }
    },
  );

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      res.json({
        member: {
          id: req.dbUser.id,
          uid: req.dbUser.uid,
          email: req.dbUser.email,
          displayName: req.dbUser.displayName,
          avatarUrl: req.dbUser.avatarUrl,
          preferredPace: req.dbUser.preferredPace,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load profile.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const displayName =
        typeof req.body?.displayName === 'string'
          ? req.body.displayName.trim()
          : undefined;
      const preferredPace =
        typeof req.body?.preferredPace === 'string'
          ? req.body.preferredPace.trim()
          : undefined;

      if (
        displayName !== undefined &&
        (displayName.length < 2 || displayName.length > 60)
      ) {
        return res
          .status(400)
          .json({ error: 'Display name must be between 2 and 60 characters.' });
      }

      const updated = await updateUserProfile(req.dbUser.id, {
        displayName,
        preferredPace,
      });

      res.json({
        member: updated
          ? {
              id: updated.id,
              uid: updated.uid,
              email: updated.email,
              displayName: updated.displayName,
              avatarUrl: updated.avatarUrl,
              preferredPace: updated.preferredPace,
            }
          : null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
