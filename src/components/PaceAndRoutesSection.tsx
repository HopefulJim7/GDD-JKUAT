import { useMemo, useState } from 'react';
import { ArrowUpRight, BookmarkPlus, Compass, Trash2 } from 'lucide-react';
import type { SavedRoute } from '../types/run';

const FEATURED_VISUALS: Record<
  string,
  { image: string; alt: string }
> = {
  Paved: {
    image: '/src/assets/images/route_river_path_1794929619314.jpg',
    alt: 'Paved waterfront running path curving beside the river at dawn',
  },
  Trail: {
    image: '/src/assets/images/route_forest_trail_1794929618335.jpg',
    alt: 'Crushed gravel forest running trail winding through tall evergreens',
  },
  Track: {
    image: '/src/assets/images/route_track_oval_1794929618706.jpg',
    alt: 'Blue synthetic athletics track lanes in crisp morning sunlight',
  },
};

const PACE_GROUPS = [
  {
    name: 'Threshold & Intervals',
    paceRange: '4:00 – 4:35 /km',
    filterType: 'Track',
    detail: 'Structured track repeats and threshold progressions for race prep.',
  },
  {
    name: 'Steady Tempo Pack',
    paceRange: '4:35 – 5:05 /km',
    filterType: 'Tempo',
    detail: 'Sustained aerobic rhythm runs along flat river paths and bridges.',
  },
  {
    name: 'Endurance Long Run',
    paceRange: '4:50 – 5:35 /km',
    filterType: 'Long Run',
    detail: 'Weekend half-marathon and marathon build sessions with aid stops.',
  },
  {
    name: 'Social & Trail Base',
    paceRange: '5:20 – 6:05 /km',
    filterType: 'Recovery',
    detail: 'Conversational midweek shakeouts and zero-drop woodland loops.',
  },
];

const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Challenging', 'Hard'];

interface PaceAndRoutesSectionProps {
  savedRoutes: SavedRoute[];
  routesLoading: boolean;
  routesError: string | null;
  onRetryRoutes: () => void;
  onFilterByType: (type: string) => void;
  onOpenSaveRoute: () => void;
  onScheduleFromRoute: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: number) => Promise<void>;
}

export function PaceAndRoutesSection({
  savedRoutes,
  routesLoading,
  routesError,
  onRetryRoutes,
  onFilterByType,
  onOpenSaveRoute,
  onScheduleFromRoute,
  onDeleteRoute,
}: PaceAndRoutesSectionProps) {
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredRoutes = useMemo(() => {
    if (difficultyFilter === 'All') return savedRoutes;
    return savedRoutes.filter((r) => r.difficulty === difficultyFilter);
  }, [savedRoutes, difficultyFilter]);

  const handleConfirmDelete = async (routeId: number) => {
    setDeletingId(routeId);
    try {
      await onDeleteRoute(routeId);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section
        id="pace-groups"
        className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 border-t border-slate-200"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Pace Groups
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
              Select a training band below to jump directly to matching sessions
              on the club calendar.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {PACE_GROUPS.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => {
                onFilterByType(group.filterType);
                document
                  .getElementById('upcoming-runs')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-6 text-left hover:bg-slate-50 transition-colors duration-150 flex flex-col justify-between cursor-pointer group focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-700"
            >
              <div>
                <p className="font-mono-tabular text-xs font-medium text-blue-700">
                  {group.paceRange}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {group.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {group.detail}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                <span>View {group.filterType} Runs</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        id="routes"
        className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 border-t border-slate-200"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Route Library
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Save favorite club routes with distance, difficulty, and start
              location. Any saved route can be selected directly when scheduling
              a run.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSaveRoute}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
            <span>Save Favorite Route</span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {DIFFICULTIES.map((level) => {
            const active = difficultyFilter === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyFilter(level)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>

        {routesError && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <p className="text-sm text-red-800">{routesError}</p>
            <button
              type="button"
              onClick={onRetryRoutes}
              className="px-3 py-1.5 text-xs font-semibold text-red-800 bg-white border border-red-300 hover:bg-red-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        )}

        {routesLoading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-40 bg-slate-200 rounded" />
                  <div className="h-6 w-52 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!routesLoading && !routesError && filteredRoutes.length === 0 && (
          <div className="mt-6 p-10 rounded-xl border border-slate-200 bg-white text-center">
            <h3 className="font-display text-2xl font-bold text-slate-900">
              No saved routes at this difficulty
            </h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Save a new favorite route to the library or switch back to all
              difficulties.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {difficultyFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setDifficultyFilter('All')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Show All Routes
                </button>
              )}
              <button
                type="button"
                onClick={onOpenSaveRoute}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                Save Favorite Route
              </button>
            </div>
          </div>
        )}

        {!routesLoading && !routesError && filteredRoutes.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRoutes.map((route, idx) => {
              const visual =
                FEATURED_VISUALS[route.terrain] ?? FEATURED_VISUALS.Paved;
              const showPhoto = idx < 3 && !failedImages[route.id];

              return (
                <article
                  key={route.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {idx < 3 && (
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                        {showPhoto ? (
                          <img
                            src={visual.image}
                            alt={visual.alt}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [route.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-200 p-6 text-center">
                            <Compass className="w-7 h-7 mb-2 text-blue-400" />
                            <p className="font-display text-xl font-bold">
                              {route.title}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      <p className="font-mono-tabular text-xs text-slate-500">
                        {route.distanceKm.toFixed(1)} km · {route.difficulty} ·{' '}
                        {route.terrain}
                      </p>
                      <h3 className="mt-1.5 font-display text-2xl font-bold text-slate-900">
                        {route.title}
                      </h3>
                      <p className="mt-1.5 text-xs font-medium text-slate-700">
                        Start: {route.startLocation}
                      </p>
                      {route.notes && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {route.notes}
                        </p>
                      )}
                      <p className="mt-3 font-mono-tabular text-[11px] text-slate-400">
                        Saved by {route.createdBy.displayName}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onScheduleFromRoute(route)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-slate-800 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                    >
                      Schedule Run
                    </button>

                    {route.isOwner && (
                      <>
                        {confirmDeleteId === route.id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={deletingId === route.id}
                              onClick={() => void handleConfirmDelete(route.id)}
                              className="px-2.5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === route.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(route.id)}
                            aria-label={`Remove ${route.title}`}
                            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
