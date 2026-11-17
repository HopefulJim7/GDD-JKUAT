import { useEffect, useState, type FormEvent } from 'react';
import { LogOut } from 'lucide-react';
import type { MemberProfile, RunSummary } from '../types/run';
import { formatRunDate } from '../utils/formatters';

interface MyScheduleSectionProps {
  member: MemberProfile | null;
  runs: RunSummary[];
  authLoading: boolean;
  onSignIn: () => Promise<unknown>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (updates: {
    displayName?: string;
    preferredPace?: string;
  }) => Promise<void>;
  onSelectRun: (run: RunSummary) => void;
  onPostRunClick: () => void;
}

export function MyScheduleSection({
  member,
  runs,
  authLoading,
  onSignIn,
  onSignOut,
  onSaveProfile,
  onSelectRun,
  onPostRunClick,
}: MyScheduleSectionProps) {
  const [displayName, setDisplayName] = useState(member?.displayName ?? '');
  const [preferredPace, setPreferredPace] = useState(
    member?.preferredPace ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(member?.displayName ?? '');
    setPreferredPace(member?.preferredPace ?? '');
  }, [member]);

  const organizedRuns = runs.filter((r) => r.isOrganizer);
  const joinedRuns = runs.filter((r) => r.isJoined && !r.isOrganizer);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await onSaveProfile({ displayName, preferredPace });
      setSaveMessage('Runner profile saved.');
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="my-schedule"
      className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 border-t border-slate-200"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            My Schedule & Runner Profile
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
            Manage the sessions you lead, track runs you joined, and keep your
            preferred pace up to date.
          </p>
        </div>

        {member && (
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {authLoading ? (
        <div className="mt-6 p-8 rounded-xl border border-slate-200 bg-white animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
      ) : !member ? (
        <div className="mt-6 p-8 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900">
              Sign in with your club account
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 max-w-lg">
              Sign in with Google to post upcoming group runs, join pace packs,
              and sync your personal running calendar across sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onSignIn()}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleProfileSubmit}
            className="lg:col-span-4 p-6 rounded-xl border border-slate-200 bg-white space-y-4 self-start"
          >
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {member.displayName}
              </h3>
              <p className="font-mono-tabular text-xs text-slate-500 mt-0.5">
                {member.email}
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="profile-pace"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Preferred Training Pace
              </label>
              <input
                id="profile-pace"
                type="text"
                maxLength={24}
                placeholder="e.g. 5:00 /km"
                value={preferredPace}
                onChange={(e) => setPreferredPace(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            {saveError && (
              <p className="text-xs text-red-700">{saveError}</p>
            )}
            {saveMessage && (
              <p className="text-xs text-emerald-700 font-medium">
                {saveMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  Runs You Organize
                </h3>
                <button
                  type="button"
                  onClick={onPostRunClick}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Post New Session
                </button>
              </div>

              {organizedRuns.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  You have not posted any upcoming runs yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {organizedRuns.map((run) => (
                    <li
                      key={run.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectRun(run)}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700 text-left cursor-pointer"
                        >
                          {run.title}
                        </button>
                        <p className="font-mono-tabular text-xs text-slate-500">
                          {formatRunDate(run.runDate)} · {run.startTime} ·{' '}
                          {run.distanceKm.toFixed(1)} km ·{' '}
                          {run.participantCount}/{run.maxParticipants} runners
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectRun(run)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800 self-start sm:self-auto cursor-pointer"
                      >
                        Edit or Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-display text-2xl font-bold text-slate-900">
                Runs You Joined
              </h3>

              {joinedRuns.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Browse the Upcoming Runs board above to join a pace pack.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {joinedRuns.map((run) => (
                    <li
                      key={run.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectRun(run)}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700 text-left cursor-pointer"
                        >
                          {run.title}
                        </button>
                        <p className="font-mono-tabular text-xs text-slate-500">
                          {formatRunDate(run.runDate)} · {run.startTime} · Meet at{' '}
                          {run.meetingPoint}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectRun(run)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 self-start sm:self-auto cursor-pointer"
                      >
                        View Details
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
