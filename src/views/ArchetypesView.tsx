import { Star, Users, Brain, HelpCircle, Ghost } from 'lucide-react';
import { Card } from '../components/Card';
import { DIMENSION_TOOLTIPS, getMbtiData } from '../data/mbti';
import type { MbtiDimension } from '../types';

interface ArchetypesViewProps {
  mbtiType: string;
  setMbtiType: (type: string) => void;
}

const normalize = (mbtiType: string) => ({
  ie: mbtiType[0] === 'E' ? 'E' : 'I',
  sn: mbtiType[1] === 'S' ? 'S' : 'N',
  tf: mbtiType[2] === 'T' ? 'T' : 'F',
  jp: mbtiType[3] === 'J' ? 'J' : 'P',
});

export const ArchetypesView = ({ mbtiType, setMbtiType }: ArchetypesViewProps) => {
  const type = normalize(mbtiType);
  const currentTypeString = `${type.ie}${type.sn}${type.tf}${type.jp}`;
  const data = getMbtiData(currentTypeString);

  const toggle = (dim: MbtiDimension) => {
    const next = { ...type };
    if (dim === 'ie') next.ie = type.ie === 'I' ? 'E' : 'I';
    if (dim === 'sn') next.sn = type.sn === 'S' ? 'N' : 'S';
    if (dim === 'tf') next.tf = type.tf === 'T' ? 'F' : 'T';
    if (dim === 'jp') next.jp = type.jp === 'J' ? 'P' : 'J';
    setMbtiType(`${next.ie}${next.sn}${next.tf}${next.jp}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="bg-indigo-900 !bg-indigo-900 text-white border-indigo-800 !border-indigo-800 relative">
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Brain size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Cognitive Architecture</span>
            </div>
            <h2 className="text-4xl font-bold mb-2">{currentTypeString}</h2>
            <h3 className="text-xl text-indigo-300 font-medium mb-4">{data.title}</h3>
            <p className="text-sm text-indigo-100/80 leading-relaxed max-w-md">{data.desc}</p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 grid grid-cols-2 gap-4">
            <DimensionToggle
              dim="ie"
              label="Energy"
              left="I"
              right="E"
              value={type.ie}
              onToggle={toggle}
            />
            <DimensionToggle
              dim="sn"
              label="Mind"
              left="S"
              right="N"
              value={type.sn}
              onToggle={toggle}
            />
            <DimensionToggle
              dim="tf"
              label="Nature"
              left="T"
              right="F"
              value={type.tf}
              onToggle={toggle}
            />
            <DimensionToggle
              dim="jp"
              label="Tactics"
              left="J"
              right="P"
              value={type.jp}
              onToggle={toggle}
            />
          </div>
        </div>
      </Card>

      <Card className="bg-white border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Functional Stack</h3>
          <div className="group relative">
            <HelpCircle size={14} className="text-slate-400 hover:text-indigo-500 cursor-help" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg hidden group-hover:block z-50 shadow-xl">
              <strong>The Engine Under the Hood.</strong> Your stack determines how you process the world.
              <br /><br />
              1. <strong>Dominant (Hero):</strong> Your automatic flow state.<br />
              2. <strong>Auxiliary (Parent):</strong> Supports the hero.<br />
              3. <strong>Tertiary (Child):</strong> Playful but immature.<br />
              4. <strong>Inferior (Grip):</strong> Your stress point.
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-around items-center">
          {data.stack.map((fn, i) => (
            <div key={i} className="flex flex-col items-center relative group w-full md:w-auto">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm mb-2 ${
                  i === 0
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                    : i === 1
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {fn}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {i === 0 ? 'Dominant' : i === 1 ? 'Auxiliary' : i === 2 ? 'Tertiary' : 'Inferior'}
              </span>
              {i < 3 && <div className="hidden md:block absolute top-6 left-1/2 ml-6 w-full h-px bg-slate-100 z-0" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-50 border-emerald-100">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star size={16} /> Strengths & Light
          </h3>
          <ul className="space-y-2 mb-6">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {s}
              </li>
            ))}
          </ul>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-emerald-800 italic">
            <span className="font-bold text-emerald-900 not-italic block mb-1">Strength Tip:</span>
            "{data.strength_tip}"
          </div>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Ghost size={16} /> Shadows & Growth
          </h3>
          <ul className="space-y-2 mb-6">
            {data.shadows.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                {s}
              </li>
            ))}
          </ul>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
            <span className="font-bold text-slate-800 not-italic block mb-1">Growth Tip:</span>
            "{data.growth}"
          </div>
        </Card>
      </div>

      <Card className="bg-white border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={16} /> Famous Kindred Spirits
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Others who have walked the path of the {currentTypeString}.
        </p>
        <div className="flex flex-wrap gap-2">
          {data.famous.length > 0 ? (
            data.famous.map((person, i) => (
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
    </div>
  );
};

interface DimensionToggleProps {
  dim: MbtiDimension;
  label: string;
  left: string;
  right: string;
  value: string;
  onToggle: (dim: MbtiDimension) => void;
}

const DimensionToggle = ({ dim, label, left, right, value, onToggle }: DimensionToggleProps) => (
  <button
    onClick={() => onToggle(dim)}
    className="flex flex-col items-center p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors relative group"
  >
    <div className="absolute top-2 right-2">
      <div className="group relative">
        <HelpCircle size={14} className="text-white/30 hover:text-white" />
        <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-50 shadow-lg">
          {DIMENSION_TOOLTIPS[dim]}
        </div>
      </div>
    </div>
    <span className="text-xs opacity-50 mb-1">{label}</span>
    <div className="flex items-center gap-2 font-bold">
      <span className={value === left ? 'text-white' : 'text-white/30'}>{left}</span>
      <div className="w-8 h-4 bg-white/20 rounded-full relative">
        <div
          className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${
            value === left ? 'left-0.5' : 'right-0.5'
          }`}
        />
      </div>
      <span className={value === right ? 'text-white' : 'text-white/30'}>{right}</span>
    </div>
  </button>
);
