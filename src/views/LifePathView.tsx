import {
  Layers,
  Star,
  Users,
  Gem,
  Briefcase,
  Target,
  Heart,
  ArrowRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/Card';
import { LockedOverlay } from '../kit';
import { COMPOUND_MEANINGS } from '../data/compoundMeanings';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import type { LifePathData, LifePathEntry } from '../types';

interface LifePathViewProps {
  lifePathData: LifePathData;
  birthDate: string;
  setBirthDate: (value: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

const FALLBACK_MEANING: LifePathEntry = {
  title: 'Unknown Path',
  keywords: '',
  description: 'Enter a birth date to reveal the path.',
  purpose: '',
  love: '',
  career: '',
  light: [],
  shadows: [],
  famous: [],
};

export const LifePathView = ({ lifePathData, birthDate, setBirthDate, isPro, onUpgrade }: LifePathViewProps) => {
  const meaning = LIFE_PATH_MEANINGS[lifePathData.number] ?? FALLBACK_MEANING;
  const { breakdown, compound } = lifePathData;
  const compoundMeaning = COMPOUND_MEANINGS[compound] ?? null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* 1. HERO HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col justify-center items-start gap-1">
          <h3 className="text-lrg text-indigo-600 font-bold uppercase tracking-widest">A Pattern Lens, Not a Prediction</h3>
          <div className="flex items-center w-full">
            <div className="flex flex-row items-baseline gap-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                Input your birth date <ArrowRight size={12} aria-hidden="true" />
              </span>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" aria-hidden="true" />
                <input
                  type="date"
                  aria-label="Birth date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-transparent border-none p-0 text-slate-800 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded cursor-pointer text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-3">
            <div aria-live="polite" aria-atomic="true">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Life Path {lifePathData.number}</h1>
              <h2 className="text-xl text-indigo-600 font-medium mb-4">{meaning.title}</h2>
            </div>
            {compoundMeaning && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800">
                <Gem size={14} className="text-indigo-500" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {compound} / {lifePathData.number}: {compoundMeaning}
                </span>
              </div>
            )}
            <p className="text-slate-600 leading-relaxed mb-6">{meaning.description}</p>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-3">
                <div className="mt-1 text-indigo-500"><Target size={18} aria-hidden="true" /></div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Primary System Pressure</h4>
                  <p className="text-sm text-slate-600">{meaning.purpose}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-rose-500"><Heart size={18} aria-hidden="true" /></div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Relational Dynamics</h4>
                  <p className="text-sm text-slate-600">{meaning.love}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-emerald-500"><Briefcase size={18} aria-hidden="true" /></div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Professional Landscape</h4>
                  <p className="text-sm text-slate-600">{meaning.career}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden md:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-3xl opacity-20 -mr-8 -mt-8"></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Layers size={14} aria-hidden="true" /> The Reduction
            </h3>
            <p className="text-[10px] text-slate-400 mb-6">Simplifying complex inputs (birth date) into a single governing archetype.</p>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider px-2">
                <span>Input</span>
                <span>Reduction</span>
                <span>Final</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                  <div className="text-sm font-mono text-indigo-300 w-12">{breakdown.rawY}</div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xs text-slate-400">
                    {breakdown.rawY.split('').join('+')} = <span className="text-white font-bold">{breakdown.ySum}</span>
                  </div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-indigo-400 w-6 text-right">{breakdown.y}</div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                  <div className="text-sm font-mono text-purple-300 w-12">{breakdown.rawM}</div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xs text-slate-400">
                    {parseInt(breakdown.rawM, 10) < 10 ? parseInt(breakdown.rawM, 10) : breakdown.rawM.split('').join('+')}
                    {parseInt(breakdown.rawM, 10) >= 10 && ` = `}
                    {parseInt(breakdown.rawM, 10) >= 10 && <span className="text-white font-bold">{breakdown.mSum}</span>}
                  </div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-purple-400 w-6 text-right">{breakdown.m}</div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                  <div className="text-sm font-mono text-emerald-300 w-12">{breakdown.rawD}</div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xs text-slate-400">
                    {parseInt(breakdown.rawD, 10) < 10 ? parseInt(breakdown.rawD, 10) : breakdown.rawD.split('').join('+')}
                    {parseInt(breakdown.rawD, 10) >= 10 && ` = `}
                    {parseInt(breakdown.rawD, 10) >= 10 && <span className="text-white font-bold">{breakdown.dSum}</span>}
                  </div>
                  <ArrowRight size={12} className="text-slate-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-emerald-400 w-6 text-right">{breakdown.d}</div>
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {breakdown.y} + {breakdown.m} + {breakdown.d} ={' '}
                  <span className="text-white font-bold">{breakdown.y + breakdown.m + breakdown.d}</span>
                </div>
                <div className="bg-indigo-600 px-4 py-2 rounded-lg shadow-lg shadow-indigo-900/50">
                  <span className="text-2xl font-bold text-white">{lifePathData.number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-50">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star size={14} aria-hidden="true" /> Constructive Expression
            </h3>
            <ul className="space-y-3">
              {meaning.light.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          {!isPro && <LockedOverlay onUpgrade={onUpgrade} label="Unlock the full path" />}
        </div>

        <div className="relative">
          <Card className="bg-slate-50 border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert size={14} aria-hidden="true" /> Common Breakdown Patterns
            </h3>
            <ul className="space-y-3">
              {meaning.shadows.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0"></div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          {!isPro && <LockedOverlay onUpgrade={onUpgrade} label="Unlock the full path" />}
        </div>

        <div className="relative">
          <Card className="bg-white border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} aria-hidden="true" /> Famous Kindred Spirits
            </h3>
            <div className="flex flex-wrap gap-2">
              {meaning.famous.length > 0 ? (
                meaning.famous.map((person, i) => (
                  <span
                    key={i}
                    className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-600 rounded-lg text-xs font-bold cursor-default"
                  >
                    {person}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400 italic">Famous figures for this type coming soon...</span>
              )}
            </div>
          </Card>
          {!isPro && <LockedOverlay onUpgrade={onUpgrade} label="Unlock the full path" />}
        </div>
      </div>
    </div>
  );
};
