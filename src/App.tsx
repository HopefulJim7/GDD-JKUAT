import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RunScheduleSection } from './components/RunScheduleSection';
import { PaceAndRoutesSection } from './components/PaceAndRoutesSection';
import { MyScheduleSection } from './components/MyScheduleSection';
import { PostRunModal } from './components/PostRunModal';
import { RunDetailModal } from './components/RunDetailModal';
import { SaveRouteModal } from './components/SaveRouteModal';
import {
  cancelRun,
  deleteClubRoute,
  fetchSavedRoutes,
  fetchUpcomingRuns,
  joinClubRun,
  leaveClubRun,
  postNewRun,
  saveClubRoute,
  updateExistingRun,
} from './lib/api';
import type {
  RouteFormValues,
  RunFormValues,
  RunSummary,
  SavedRoute,
} from './types/run';

function RunningClubApp() {
  const {
    firebaseUser,
    member,
    loading: authLoading,
    authError,
    signInWithGoogle,
    signOut,
    getToken,
    saveProfile,
    clearAuthError,
  } = useAuth();

  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');

  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalMode, setPostModalMode] = useState<'create' | 'edit'>('create');
  const [editingRunId, setEditingRunId] = useState<number | null>(null);
  const [modalInitialValues, setModalInitialValues] = useState<
    Partial<RunFormValues> | undefined
  >(undefined);

  const [saveRouteModalOpen, setSaveRouteModalOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('run');
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [notice, setNotice] = useState<string | null>(null);

  const handleCloseRunDetail = useCallback(() => {
    setSelectedRunId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('run')) {
        url.searchParams.delete('run');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setRunsError(null);
    try {
      const token = await getToken();
      const data = await fetchUpcomingRuns({}, token);
      setRuns(data);
    } catch (error) {
      setRunsError(
        error instanceof Error
          ? error.message
          : 'Unable to load upcoming runs right now.',
      );
    } finally {
      setRunsLoading(false);
    }
  }, [getToken]);

  const loadRoutes = useCallback(async () => {
    setRoutesError(null);
    try {
      const token = await getToken();
      const data = await fetchSavedRoutes(token);
      setSavedRoutes(data);
    } catch (error) {
      setRoutesError(
        error instanceof Error
          ? error.message
          : 'Unable to load the club route library.',
      );
    } finally {
      setRoutesLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!authLoading) {
      void loadRuns();
      void loadRoutes();
    }
  }, [authLoading, firebaseUser, loadRuns, loadRoutes]);

  const selectedRun =
    selectedRunId !== null
      ? runs.find((r) => r.id === selectedRunId) ?? null
      : null;

  const ensureSignedInToken = useCallback(async (): Promise<string | null> => {
    const existing = await getToken();
    if (existing) {
      return existing;
    }
    const user = await signInWithGoogle();
    if (!user) {
      return null;
    }
    return user.getIdToken();
  }, [getToken, signInWithGoogle]);

  const openCreateModal = useCallback(
    async (preset?: Partial<RunFormValues>) => {
      const token = await ensureSignedInToken();
      if (!token) return;
      setPostModalMode('create');
      setEditingRunId(null);
      setModalInitialValues(preset);
      setPostModalOpen(true);
    },
    [ensureSignedInToken],
  );

  const openSaveRouteModal = useCallback(async () => {
    const token = await ensureSignedInToken();
    if (!token) return;
    setSaveRouteModalOpen(true);
  }, [ensureSignedInToken]);

  const handleScheduleFromRoute = useCallback(
    (route: SavedRoute) => {
      void openCreateModal({
        routeId: route.id,
        title: route.title,
        distanceKm: route.distanceKm,
        meetingPoint: route.startLocation,
        terrain: route.terrain,
        routeNotes: route.notes ?? '',
        description: route.notes ?? '',
        runType:
          route.terrain === 'Trail'
            ? 'Trail'
            : route.terrain === 'Track'
              ? 'Track'
              : route.difficulty === 'Easy'
                ? 'Recovery'
                : 'Tempo',
      });
    },
    [openCreateModal],
  );

  const handleNavbarPrimary = useCallback(async () => {
    if (member) {
      await openCreateModal();
    } else {
      await signInWithGoogle();
    }
  }, [member, openCreateModal, signInWithGoogle]);

  const handleEditRun = (run: RunSummary) => {
    setSelectedRunId(null);
    setPostModalMode('edit');
    setEditingRunId(run.id);
    setModalInitialValues({
      routeId: run.routeId,
      title: run.title,
      description: run.description,
      runDate: run.runDate,
      startTime: run.startTime,
      meetingPoint: run.meetingPoint,
      distanceKm: run.distanceKm,
      paceLabel: run.paceLabel,
      runType: run.runType,
      terrain: run.terrain,
      elevationGainM: run.elevationGainM,
      maxParticipants: run.maxParticipants,
      routeNotes: run.routeNotes ?? '',
    });
    setPostModalOpen(true);
  };

  const handleSubmitRun = async (values: RunFormValues) => {
    const token = await ensureSignedInToken();
    if (!token) {
      throw new Error('Sign in is required to publish a run.');
    }

    if (postModalMode === 'edit' && editingRunId !== null) {
      await updateExistingRun(editingRunId, values, token);
      setNotice('Run details updated.');
    } else {
      await postNewRun(values, token);
      setNotice('Your upcoming run is now published on the club schedule.');
    }
    await loadRuns();
  };

  const handleSaveRoute = async (values: RouteFormValues) => {
    const token = await ensureSignedInToken();
    if (!token) {
      throw new Error('Sign in is required to save a route.');
    }
    await saveClubRoute(values, token);
    setNotice(`Saved "${values.title}" to the club route library.`);
    await loadRoutes();
  };

  const handleDeleteRoute = async (routeId: number) => {
    const token = await ensureSignedInToken();
    if (!token) {
      throw new Error('Sign in is required.');
    }
    await deleteClubRoute(routeId, token);
    setNotice('Removed route from the library.');
    await loadRoutes();
    await loadRuns();
  };

  const handleDeleteRun = async (runId: number) => {
    const token = await ensureSignedInToken();
    if (!token) {
      throw new Error('Sign in is required.');
    }
    await cancelRun(runId, token);
    setNotice('Session cancelled and removed from the schedule.');
    await loadRuns();
  };

  const handleToggleRsvp = async (run: RunSummary) => {
    const token = await ensureSignedInToken();
    if (!token) return;

    if (run.isJoined) {
      await leaveClubRun(run.id, token);
      setNotice(`Left "${run.title}".`);
    } else {
      await joinClubRun(run.id, token);
      setNotice(`Confirmed your spot for "${run.title}".`);
    }
    await loadRuns();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        isSignedIn={Boolean(member)}
        onPrimaryAction={handleNavbarPrimary}
      />

      {(authError || notice) && (
        <div className="max-w-[1280px] w-full mx-auto px-6 lg:px-10 pt-4">
          <div
            role="status"
            className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-4 ${
              authError
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <span>{authError || notice}</span>
            <button
              type="button"
              onClick={() => {
                clearAuthError();
                setNotice(null);
              }}
              className="font-semibold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        <HeroSection
          runs={runs}
          isSignedIn={Boolean(member)}
          onPostRunClick={() => void openCreateModal()}
        />

        <RunScheduleSection
          runs={runs}
          loading={runsLoading}
          error={runsError}
          activeTypeFilter={activeTypeFilter}
          onTypeFilterChange={setActiveTypeFilter}
          onRetry={() => void loadRuns()}
          onPostRunClick={() => void openCreateModal()}
          onSelectRun={(run) => setSelectedRunId(run.id)}
          onToggleRsvp={handleToggleRsvp}
        />

        <PaceAndRoutesSection
          savedRoutes={savedRoutes}
          routesLoading={routesLoading}
          routesError={routesError}
          onRetryRoutes={() => void loadRoutes()}
          onFilterByType={setActiveTypeFilter}
          onOpenSaveRoute={() => void openSaveRouteModal()}
          onScheduleFromRoute={handleScheduleFromRoute}
          onDeleteRoute={handleDeleteRoute}
        />

        <MyScheduleSection
          member={member}
          runs={runs}
          authLoading={authLoading}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
          onSaveProfile={saveProfile}
          onSelectRun={(run) => setSelectedRunId(run.id)}
          onPostRunClick={() => void openCreateModal()}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-display text-xl font-bold text-slate-900">
            Meridian Run Club
          </span>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <a href="#upcoming-runs" className="hover:text-slate-900">
              Upcoming Runs
            </a>
            <a href="#pace-groups" className="hover:text-slate-900">
              Pace Groups
            </a>
            <a href="#routes" className="hover:text-slate-900">
              Route Library
            </a>
            <a href="#my-schedule" className="hover:text-slate-900">
              My Schedule
            </a>
            <span>© 2026 Meridian Run Club</span>
          </div>
        </div>
      </footer>

      <PostRunModal
        isOpen={postModalOpen}
        mode={postModalMode}
        savedRoutes={savedRoutes}
        initialValues={modalInitialValues}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handleSubmitRun}
      />

      <SaveRouteModal
        isOpen={saveRouteModalOpen}
        onClose={() => setSaveRouteModalOpen(false)}
        onSubmit={handleSaveRoute}
      />

      <RunDetailModal
        run={selectedRun}
        onClose={handleCloseRunDetail}
        onEdit={handleEditRun}
        onDelete={handleDeleteRun}
        onToggleRsvp={handleToggleRsvp}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RunningClubApp />
    </AuthProvider>
  );
}
