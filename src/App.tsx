import { useMemo, useState } from 'react';
import logo from './assets/logo.png';
import { LifePathView } from './views/LifePathView';
import { ArchetypesView } from './views/ArchetypesView';
import { calculateLifePath } from './lib/calculateLifePath';

type View = 'lifepath' | 'archetypes';

const TABS: { id: View; label: string }[] = [
  { id: 'lifepath', label: 'Life Path' },
  { id: 'archetypes', label: 'Archetypes' },
];

const DEFAULT_BIRTH_DATE = '1986-08-09';
const DEFAULT_MBTI = 'INFP';

export default function SoulCompassApp() {
  const [view, setView] = useState<View>('lifepath');
  const [mbtiType, setMbtiType] = useState(DEFAULT_MBTI);
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH_DATE);
  const lifePathData = useMemo(() => calculateLifePath(birthDate), [birthDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setView('lifepath')}
          >
            <img
              src={logo}
              alt="Life Path Numbering"
              className="h-20 w-auto sm:h-20 object-contain"
            />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
              Life Number Pathing
            </h1>
          </div>

          <div
            role="tablist"
            className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100 overflow-x-auto"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={view === tab.id}
                onClick={() => setView(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {view === 'lifepath' && (
          <LifePathView
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            lifePathData={lifePathData}
          />
        )}

        {view === 'archetypes' && (
          <ArchetypesView mbtiType={mbtiType} setMbtiType={setMbtiType} />
        )}
      </main>
    </div>
  );
}
