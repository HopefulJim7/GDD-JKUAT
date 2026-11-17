import { useEffect, useState } from 'react';
import { Check, Link2, X } from 'lucide-react';
import type { RunSummary } from '../types/run';
import { formatRunDate } from '../utils/formatters';
import { buildRunInviteUrl, copyTextToClipboard } from '../utils/invite';

interface RunDetailModalProps {
  run: RunSummary | null;
  onClose: () => void;
  onEdit: (run: RunSummary) => void;
  onDelete: (runId: number) => Promise<void>;
  onToggleRsvp: (run: RunSummary) => Promise<void>;
}

export function RunDetailModal({
  run,
  onClose,
  onEdit,
  onDelete,
  onToggleRsvp,
}: RunDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
    setActionError(null);
    setCopiedInvite(false);
  }, [run?.id]);

  useEffect(() => {
    if (!run) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [run, onClose]);

  if (!run) {
    return null;
  }

  const isFull = run.participantCount >= run.maxParticipants;
  const inviteUrl = buildRunInviteUrl(run.id);

  const handleCopyInvite = async () => {
    const ok = await copyTextToClipboard(inviteUrl);
    if (ok) {
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2400);
    }
  };

  const handleRsvp = async () => {
    setActionError(null);
    setBusy(true);
    try {
      await onToggleRsvp(run);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update RSVP.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    setBusy(true);
    try {
      await onDelete(run.id);
      onClose();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to cancel session.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono-tabular text-xs text-blue-700 font-medium">
              {formatRunDate(run.runDate)} · {run.startTime} · {run.runType}
            </p>
            <h2
              id="run-detail-title"
              className="mt-1 font-display text-3xl font-bold text-slate-900"
            >
              {run.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session details"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Distance</p>
            <p className="font-mono-tabular text-sm font-semibold text-slate-900 mt-0.5">
              {run.distanceKm.toFixed(1)} km
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Target Pace</p>
            <p className="font-mono-tabular text-sm font-semibold text-slate-900 mt-0.5">
              {run.paceLabel}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Elevation</p>
            <p className="font-mono-tabular text-sm font-semibold text-slate-900 mt-0.5">
              +{run.elevationGainM} m
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Surface</p>
            <p className="font-mono-tabular text-sm font-semibold text-slate-900 mt-0.5">
              {run.terrain}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">
              Session Briefing
            </h3>
            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
              {run.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-semibold text-slate-500">
                Meeting Point
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {run.meetingPoint}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500">
                Run Leader
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {run.organizer.displayName}
                {run.organizer.preferredPace
                  ? ` (${run.organizer.preferredPace})`
                  : ''}
              </p>
            </div>
          </div>

          {run.routeTitle && (
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500">
                Library Route
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {run.routeTitle}
              </p>
            </div>
          )}

          {run.routeNotes && (
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500">
                Route & Logistics Notes
              </h3>
              <p className="mt-1 text-sm text-slate-700">{run.routeNotes}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-500">
                Attending Runners
              </h3>
              <span className="font-mono-tabular text-xs font-medium text-slate-700">
                {run.participantCount} / {run.maxParticipants} attending
              </span>
            </div>
            {run.participants.length === 0 ? (
              <p className="mt-1.5 text-sm text-slate-500">
                No runners registered yet. Be the first to join.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                {run.participants.map((p) => p.displayName).join(' · ')}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500">
              Shareable Invite Link
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                aria-label="Run invite link"
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700"
              />
              <button
                type="button"
                onClick={() => void handleCopyInvite()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {actionError && (
          <p
            role="alert"
            className="mt-4 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
          >
            {actionError}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {run.isOrganizer ? (
            <div className="flex flex-wrap items-center gap-2 w-full justify-between">
              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                >
                  Cancel Session
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDelete}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {busy ? 'Cancelling...' : 'Confirm Cancel Run'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Keep
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || (!run.isJoined && isFull)}
                  onClick={handleRsvp}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                    run.isJoined
                      ? 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                      : 'text-white bg-blue-700 hover:bg-blue-800'
                  }`}
                >
                  {busy
                    ? 'Updating...'
                    : run.isJoined
                      ? 'Joined · Leave'
                      : 'Join Run'}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(run)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Edit Details
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={busy || (!run.isJoined && isFull)}
                onClick={handleRsvp}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  run.isJoined
                    ? 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                    : isFull
                      ? 'text-slate-500 bg-slate-100'
                      : 'text-white bg-blue-700 hover:bg-blue-800'
                }`}
              >
                {busy
                  ? 'Updating...'
                  : run.isJoined
                    ? 'Joined · Leave'
                    : isFull
                      ? 'Session Full'
                      : 'Join Run'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
