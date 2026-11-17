import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  RouteDifficulty,
  RouteFormValues,
  TerrainType,
} from '../types/run';

interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RouteFormValues) => Promise<void>;
}

const DIFFICULTIES: RouteDifficulty[] = [
  'Easy',
  'Moderate',
  'Challenging',
  'Hard',
];
const TERRAINS: TerrainType[] = ['Paved', 'Trail', 'Track', 'Mixed'];

export function SaveRouteModal({
  isOpen,
  onClose,
  onSubmit,
}: SaveRouteModalProps) {
  const [title, setTitle] = useState('');
  const [distanceKm, setDistanceKm] = useState('10.0');
  const [difficulty, setDifficulty] = useState<RouteDifficulty>('Moderate');
  const [startLocation, setStartLocation] = useState('');
  const [terrain, setTerrain] = useState<TerrainType>('Paved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDistanceKm('10.0');
    setDifficulty('Moderate');
    setStartLocation('');
    setTerrain('Paved');
    setNotes('');
    setError(null);
  }, [isOpen]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedDistance = Number.parseFloat(distanceKm);
    if (
      !Number.isFinite(parsedDistance) ||
      parsedDistance < 1 ||
      parsedDistance > 100
    ) {
      setError('Distance must be between 1 and 100 km.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        distanceKm: parsedDistance,
        difficulty,
        startLocation: startLocation.trim(),
        terrain,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save route to the library.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-route-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2
              id="save-route-modal-title"
              className="font-display text-3xl font-bold text-slate-900"
            >
              Save Favorite Route
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a reusable route to the club library so any member can
              schedule a run on it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close save route dialog"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="route-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Route Title
            </label>
            <input
              id="route-title"
              type="text"
              required
              minLength={3}
              maxLength={90}
              placeholder="e.g. Victoria Park Outer Perimeter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="route-distance"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Distance (km)
              </label>
              <input
                id="route-distance"
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
                htmlFor="route-difficulty"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Difficulty
              </label>
              <select
                id="route-difficulty"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as RouteDifficulty)
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="route-terrain"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Terrain
              </label>
              <select
                id="route-terrain"
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

          <div>
            <label
              htmlFor="route-start"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Start Location
            </label>
            <input
              id="route-start"
              type="text"
              required
              minLength={3}
              maxLength={140}
              placeholder="e.g. East Gate Pavilion Fountain"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="route-notes"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Route Notes (Optional)
            </label>
            <textarea
              id="route-notes"
              rows={2}
              maxLength={320}
              placeholder="Surface conditions, turn highlights, water fountains..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {submitting ? 'Saving...' : 'Save Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
