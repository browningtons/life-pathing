import { useMemo, useState } from 'react';
import logo from './assets/logo.png';
import { LifePathView } from './views/LifePathView';
import { ArchetypesView } from './views/ArchetypesView';
import { PersonalityView } from './views/PersonalityView';
import { calculateLifePath } from './lib/calculateLifePath';
import { captureUtmParams } from './kit';

type View = 'lifepath' | 'archetypes' | 'profile';

const TABS: { id: View; label: string }[] = [
  { id: 'lifepath', label: 'Life Path' },
  { id: 'archetypes', label: 'Archetypes' },
  { id: 'profile', label: 'Profile' },
];

const DEFAULT_BIRTH_DATE = '1986-08-09';
const DEFAULT_MBTI = 'INFP';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500';

export default function SoulCompassApp() {
  // Capture UTMs once per session. Inside the component body so that
  // KitProvider's setKitConfig() has already run by the time we read it.
  // (Kept on even with the paywall off — useful traffic-source signal
  // for whenever a paid surface is reintroduced.)
  captureUtmParams();

  const [view, setView] = useState<View>('lifepath');
  const [mbtiType, setMbtiType] = useState(DEFAULT_MBTI);
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH_DATE);
  const lifePathData = useMemo(() => calculateLifePath(birthDate), [birthDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-12">
      <header>
        <nav
          aria-label="Primary"
          className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-8"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView('lifepath')}
              aria-label="Life Number Pathing — go to Life Path"
              className={`flex items-center gap-3 rounded-md ${FOCUS_RING}`}
            >
              <img
                src={logo}
                alt=""
                aria-hidden="true"
                className="h-20 w-auto sm:h-20 object-contain"
              />
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
                Life Number Pathing
              </span>
            </button>

            <div
              role="tablist"
              aria-label="Sections"
              className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100 overflow-x-auto"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={view === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setView(tab.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${FOCUS_RING} ${
                    view === tab.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {view === 'lifepath' && (
          <div
            role="tabpanel"
            id="panel-lifepath"
            aria-labelledby="tab-lifepath"
          >
            <LifePathView
              birthDate={birthDate}
              setBirthDate={setBirthDate}
              lifePathData={lifePathData}
            />
          </div>
        )}

        {view === 'archetypes' && (
          <div
            role="tabpanel"
            id="panel-archetypes"
            aria-labelledby="tab-archetypes"
          >
            <ArchetypesView mbtiType={mbtiType} setMbtiType={setMbtiType} />
          </div>
        )}

        {view === 'profile' && (
          <div
            role="tabpanel"
            id="panel-profile"
            aria-labelledby="tab-profile"
          >
            <PersonalityView mbtiType={mbtiType} lifePathNumber={lifePathData.number} />
          </div>
        )}
      </main>
    </div>
  );
}
