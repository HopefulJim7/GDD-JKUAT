import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  RunFormValues,
  RunType,
  SavedRoute,
  TerrainType,
} from '../types/run';
import { getTomorrowIsoDate } from '../utils/formatters';

interface PostRunModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  savedRoutes: SavedRoute[];
  initialValues?: Partial<RunFormValues>;
  onClose: () => void;
  onSubmit: (values: RunFormValues) => Promise<void>;
}

const RUN_TYPES: RunType[] = ['Tempo', 'Recovery', 'Long Run', 'Trail', 'Track'];
const TERRAINS: TerrainType[] = ['Paved', 'Trail', 'Track', 'Mixed'];

export function PostRunModal({
  isOpen,
  mode,
  savedRoutes,
  initialValues,
  onClose,
  onSubmit,
}: PostRunModalProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [runDate, setRunDate] = useState(getTomorrowIsoDate());
  const [startTime, setStartTime] = useState('06:30');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [distanceKm, setDistanceKm] = useState('10');
  const [paceLabel, setPaceLabel] = useState('5:00 /km');
  const [runType, setRunType] = useState<RunType>('Tempo');
  const [terrain, setTerrain] = useState<TerrainType>('Paved');
  const [elevationGainM, setElevationGainM] = useState('40');
  const [maxParticipants, setMaxParticipants] = useState('24');
  const [routeNotes, setRouteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRouteId(
      initialValues?.routeId !== undefined && initialValues?.routeId !== null
        ? String(initialValues.routeId)
        : '',
    );
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setRunDate(initialValues?.runDate ?? getTomorrowIsoDate());
    setStartTime(initialValues?.startTime ?? '06:30');
    setMeetingPoint(initialValues?.meetingPoint ?? '');
    setDistanceKm(
      initialValues?.distanceKm !== undefined
        ? String(initialValues.distanceKm)
        : '10',
    );
    setPaceLabel(initialValues?.paceLabel ?? '5:00 /km');
    setRunType(initialValues?.runType ?? 'Tempo');
    setTerrain(initialValues?.terrain ?? 'Paved');
    setElevationGainM(
      initialValues?.elevationGainM !== undefined
        ? String(initialValues.elevationGainM)
        : '40',
    );
    setMaxParticipants(
      initialValues?.maxParticipants !== undefined
        ? String(initialValues.maxParticipants)
        : '24',
    );
    setRouteNotes(initialValues?.routeNotes ?? '');
    setError(null);
  }, [isOpen, initialValues]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleRouteSelect = (value: string) => {
    setSelectedRouteId(value);
    if (!value) {
      return;
    }
    const chosen = savedRoutes.find((r) => String(r.id) === value);
    if (!chosen) return;

    setTitle(chosen.title);
    setDistanceKm(String(chosen.distanceKm));
    setMeetingPoint(chosen.startLocation);
    setTerrain(chosen.terrain);
    if (chosen.notes) {
      setRouteNotes(chosen.notes);
      if (!description.trim()) {
        setDescription(chosen.notes);
      }
    }
    if (chosen.terrain === 'Trail') {
      setRunType('Trail');
    } else if (chosen.terrain === 'Track') {
      setRunType('Track');
    } else if (chosen.difficulty === 'Easy') {
      setRunType('Recovery');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedDist = Number.parseFloat(distanceKm);
    const parsedElev = Number.parseInt(elevationGainM || '0', 10);
    const parsedMax = Number.parseInt(maxParticipants || '24', 10);
    const parsedRouteId = selectedRouteId
      ? Number.parseInt(selectedRouteId, 10)
      : null;

    if (!Number.isFinite(parsedDist) || parsedDist < 1 || parsedDist > 100) {
      setError('Distance must be between 1 and 100 km.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        routeId:
          parsedRouteId && Number.isFinite(parsedRouteId)
            ? parsedRouteId
            : null,
        title: title.trim(),
        description: description.trim(),
        runDate,
        startTime,
        meetingPoint: meetingPoint.trim(),
        distanceKm: parsedDist,
        paceLabel: paceLabel.trim(),
        runType,
        terrain,
        elevationGainM: Number.isFinite(parsedElev) ? parsedElev : 0,
        maxParticipants: Number.isFinite(parsedMax) ? parsedMax : 24,
        routeNotes: routeNotes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save upcoming run.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-run-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2
              id="post-run-modal-title"
              className="font-display text-3xl font-bold text-slate-900"
            >
              {mode === 'edit' ? 'Edit Upcoming Run' : 'Post an Upcoming Run'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pick a saved route from the club library or enter custom session
              details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="run-library-route"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Route Library (Optional)
            </label>
            <select
              id="run-library-route"
              value={selectedRouteId}
              onChange={(e) => handleRouteSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            >
              <option value="">Custom route (enter details manually)</option>
              {savedRoutes.map((route) => (
                <option key={route.id} value={String(route.id)}>
                  {route.title} — {route.distanceKm.toFixed(1)} km ·{' '}
                  {route.difficulty} · Start: {route.startLocation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="run-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Session Title
            </label>
            <input
              id="run-title"
              type="text"
              required
              minLength={3}
              maxLength={90}
              placeholder="e.g. Riverfront Dawn Tempo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="run-type"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Workout Type
              </label>
              <select
                id="run-type"
                value={runType}
                onChange={(e) => setRunType(e.target.value as RunType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              >
                {RUN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="run-terrain"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Surface / Terrain
              </label>
              <select
                id="run-terrain"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value as TerrainType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              >
                {TERRAINS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="run-date"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Date
              </label>
              <input
                id="run-date"
                type="date"
                required
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="run-time"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Start Time
              </label>
              <input
                id="run-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="run-distance"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Distance (km)
              </label>
              <input
                id="run-distance"
                type="number"
                step="0.1"
                min="1"
                max="100"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="run-pace"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Target Pace
              </label>
              <input
                id="run-pace"
                type="text"
                required
                maxLength={24}
                placeholder="4:50 /km"
                value={paceLabel}
                onChange={(e) => setPaceLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="run-elevation"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Elevation (m)
              </label>
              <input
                id="run-elevation"
                type="number"
                min="0"
                max="5000"
                value={elevationGainM}
                onChange={(e) => setElevationGainM(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="run-cap"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Max Runners
              </label>
              <input
                id="run-cap"
                type="number"
                min="2"
                max="200"
                required
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="run-meetup"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Meeting Point
            </label>
            <input
              id="run-meetup"
              type="text"
              required
              minLength={3}
              maxLength={140}
              placeholder="e.g. Southbank Footbridge North Steps"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="run-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Session Briefing
            </label>
            <textarea
              id="run-description"
              required
              minLength={10}
              maxLength={600}
              rows={3}
              placeholder="Describe warm-up, workout segments, and regroup points..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="run-notes"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Route & Logistics Notes (Optional)
            </label>
            <input
              id="run-notes"
              type="text"
              maxLength={240}
              placeholder="e.g. Bag drop available, water stop at km 6"
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : mode === 'edit'
                  ? 'Save Changes'
                  : 'Publish Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
