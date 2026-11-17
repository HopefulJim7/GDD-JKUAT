import { useMemo, useState } from 'react';
import { CalendarPlus, Check, Link2, Search } from 'lucide-react';
import type { RunSummary } from '../types/run';
import { formatRunDate } from '../utils/formatters';
import { buildRunInviteUrl, copyTextToClipboard } from '../utils/invite';

interface RunScheduleSectionProps {
  runs: RunSummary[];
  loading: boolean;
  error: string | null;
  activeTypeFilter: string;
  onTypeFilterChange: (type: string) => void;
  onRetry: () => void;
  onPostRunClick: () => void;
  onSelectRun: (run: RunSummary) => void;
  onToggleRsvp: (run: RunSummary) => Promise<void>;
}

const RUN_TYPES = ['All', 'Tempo', 'Recovery', 'Long Run', 'Trail', 'Track'];
const TERRAINS = ['All', 'Paved', 'Trail', 'Track', 'Mixed'];

export function RunScheduleSection({
  runs,
  loading,
  error,
  activeTypeFilter,
  onTypeFilterChange,
  onRetry,
  onPostRunClick,
  onSelectRun,
  onToggleRsvp,
}: RunScheduleSectionProps) {
  const [terrainFilter, setTerrainFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRunId, setPendingRunId] = useState<number | null>(null);
  const [copiedRunId, setCopiedRunId] = useState<number | null>(null);

  const filteredRuns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return runs.filter((run) => {
      if (activeTypeFilter !== 'All' && run.runType !== activeTypeFilter) {
        return false;
      }
      if (terrainFilter !== 'All' && run.terrain !== terrainFilter) {
        return false;
      }
      if (query) {
        const matchesTitle = run.title.toLowerCase().includes(query);
        const matchesPoint = run.meetingPoint.toLowerCase().includes(query);
        const matchesOrganizer = run.organizer.displayName
          .toLowerCase()
          .includes(query);
        if (!matchesTitle && !matchesPoint && !matchesOrganizer) {
          return false;
        }
      }
      return true;
    });
  }, [runs, activeTypeFilter, terrainFilter, searchQuery]);

  const handleRsvpClick = async (run: RunSummary) => {
    setPendingRunId(run.id);
    try {
      await onToggleRsvp(run);
    } finally {
      setPendingRunId(null);
    }
  };

  const handleCopyInvite = async (runId: number) => {
    const inviteUrl = buildRunInviteUrl(runId);
    const copied = await copyTextToClipboard(inviteUrl);
    if (copied) {
      setCopiedRunId(runId);
      window.setTimeout(() => {
        setCopiedRunId((prev) => (prev === runId ? null : prev));
      }, 2400);
    }
  };

  return (
    <section
      id="upcoming-runs"
      className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 border-t border-slate-200"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Upcoming Club Runs
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
            Every session below is posted by a club member. Filter by workout
            type or terrain, inspect who is attending, and reserve your spot.
          </p>
        </div>

        <button
          type="button"
          onClick={onPostRunClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <CalendarPlus className="w-4 h-4" aria-hidden="true" />
          <span>Post a Run</span>
        </button>
      </div>

      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter runs by session type"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start"
        >
          {RUN_TYPES.map((type) => {
            const active = activeTypeFilter === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTypeFilterChange(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, meetup, leader"
              aria-label="Search upcoming runs"
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <select
            value={terrainFilter}
            onChange={(e) => setTerrainFilter(e.target.value)}
            aria-label="Filter by terrain"
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
          >
            {TERRAINS.map((terrain) => (
              <option key={terrain} value={terrain}>
                {terrain === 'All' ? 'All Terrains' : terrain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-semibold text-red-800 bg-white border border-red-300 hover:bg-red-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse"
            >
              <div className="h-3 w-48 bg-slate-200 rounded mb-4" />
              <div className="h-6 w-64 bg-slate-200 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-100 rounded mb-6" />
              <div className="h-9 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredRuns.length === 0 && (
        <div className="mt-6 p-10 rounded-xl border border-slate-200 bg-white text-center">
          <h3 className="font-display text-2xl font-bold text-slate-900">
            No upcoming runs match these filters
          </h3>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            Try clearing your terrain or pace-group filter, or post a new group
            run at your preferred time and pace.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {(activeTypeFilter !== 'All' ||
              terrainFilter !== 'All' ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  onTypeFilterChange('All');
                  setTerrainFilter('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onPostRunClick}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              Post Upcoming Run
            </button>
          </div>
        </div>
      )}

      {!loading && !error && filteredRuns.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRuns.map((run) => {
            const isFull = run.participantCount >= run.maxParticipants;
            const isBusy = pendingRunId === run.id;
            const isCopied = copiedRunId === run.id;
            const spotsLeft = Math.max(0, run.maxParticipants - run.participantCount);
            const visibleRunners = run.participants.slice(0, 5);
            const extraRunnersCount = Math.max(
              0,
              run.participants.length - visibleRunners.length,
            );

            return (
              <article
                key={run.id}
                className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between transition-colors duration-150 hover:border-slate-300"
              >
                <div>
                  <div className="font-mono-tabular text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-slate-800">
                      {formatRunDate(run.runDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{run.startTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{run.distanceKm.toFixed(1)} km</span>
                    <span aria-hidden="true">·</span>
                    <span>{run.paceLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{run.runType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{run.terrain}</span>
                  </div>

                  <h3 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-slate-900">
                    <button
                      type="button"
                      onClick={() => onSelectRun(run)}
                      className="text-left hover:text-blue-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    >
                      {run.title}
                    </button>
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {run.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700">
                        Attending Runners
                      </span>
                      <span className="font-mono-tabular text-slate-600">
                        {run.participantCount} / {run.maxParticipants} attending
                        {' · '}
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </span>
                    </div>

                    {run.participants.length === 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        No runners registered yet — be the first to join.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {visibleRunners.map((p) => p.displayName).join(' · ')}
                        {extraRunnersCount > 0 && (
                          <>
                            {' · '}
                            <button
                              type="button"
                              onClick={() => onSelectRun(run)}
                              className="font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              +{extraRunnersCount} more
                            </button>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="text-slate-700 font-medium">
                      Meet at {run.meetingPoint}
                    </p>
                    <p className="font-mono-tabular">
                      Led by {run.organizer.displayName} · +{run.elevationGainM}m
                      elev
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopyInvite(run.id)}
                      aria-label={`Copy invite link for ${run.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                          <span className="text-emerald-700">Copied Link</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Invite</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRun(run)}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {run.isOrganizer ? 'Manage' : 'Details'}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy || (!run.isJoined && isFull)}
                      onClick={() => handleRsvpClick(run)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        run.isJoined
                          ? 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                          : isFull
                            ? 'text-slate-500 bg-slate-100'
                            : 'text-white bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isBusy
                        ? 'Updating...'
                        : run.isJoined
                          ? 'Joined · Leave'
                          : isFull
                            ? 'Session Full'
                            : 'Join Run'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
