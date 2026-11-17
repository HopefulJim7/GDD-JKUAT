interface NavbarProps {
  isSignedIn: boolean;
  onPrimaryAction: () => void;
}

export function Navbar({ isSignedIn, onPrimaryAction }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Meridian Run Club
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#upcoming-runs"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Upcoming Runs
          </a>
          <a
            href="#pace-groups"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pace Groups
          </a>
          <a
            href="#routes"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Routes
          </a>
          <a
            href="#my-schedule"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            My Schedule
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-[0.99] rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {isSignedIn ? 'Post a Run' : 'Member Sign In'}
          </button>
        </div>
      </div>
    </header>
  );
}
