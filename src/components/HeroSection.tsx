import { useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { RunSummary } from '../types/run';

interface HeroSectionProps {
  runs: RunSummary[];
  isSignedIn: boolean;
  onPostRunClick: () => void;
}

export function HeroSection({
  runs,
  isSignedIn,
  onPostRunClick,
}: HeroSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const totalDistance = runs.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalSpots = runs.reduce((sum, r) => sum + r.participantCount, 0);
  const uniqueTypes = new Set(runs.map((r) => r.runType)).size;

  return (
    <section
      id="top"
      className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10 pb-12 lg:pt-14 lg:pb-16"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between py-2">
          <div>
            <p className="font-mono-tabular text-xs font-medium tracking-wider text-blue-700 mb-3">
              Member-Organized Group Sessions
            </p>
            <h1
              className="font-display font-bold text-slate-900 tracking-tight leading-[1.02] max-w-xl"
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
                textWrap: 'balance',
              }}
            >
              Run together on city paths, trails, and track.
            </h1>
            <p className="mt-5 text-base sm:text-[17px] leading-relaxed text-slate-600 max-w-xl">
              Meridian Run Club is a shared training calendar built by its
              runners. Browse upcoming sessions by pace and surface, claim a spot
              on the starting line, or post your own group run for the week ahead.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onPostRunClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <span>{isSignedIn ? 'Post Upcoming Run' : 'Sign In to Post a Run'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <a
              href="#upcoming-runs"
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 bg-white rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Browse Schedule
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-200 min-h-[280px] lg:min-h-[380px]">
          {!imageFailed ? (
            <img
              src="/src/assets/images/hero_morning_run_1794929617862.jpg"
              alt="Meridian Run Club runners crossing a riverfront footbridge at dawn"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="w-full h-full lg:h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200 p-8 text-center">
              <MapPin className="w-8 h-8 mb-3 text-blue-400" aria-hidden="true" />
              <p className="font-display text-2xl font-bold">Meridian Dawn Pack</p>
              <p className="text-sm text-slate-400 mt-1">
                Southbank Footbridge · 06:30
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-5">
            <p className="font-mono-tabular text-xs text-slate-200">
              Dawn Pack · Southbank Footbridge · 06:30 Start
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Upcoming Sessions</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-medium text-slate-900">
            {runs.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Scheduled Distance</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-medium text-slate-900">
            {totalDistance.toFixed(1)} km
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Confirmed Runners</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-medium text-slate-900">
            {totalSpots}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Formats</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-medium text-slate-900">
            {uniqueTypes || 5}
          </p>
        </div>
      </div>
    </section>
  );
}
