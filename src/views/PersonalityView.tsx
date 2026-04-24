import { useState } from 'react';
import {
  categories,
  categoryMeta,
  convergenceThemes,
  descriptors,
  growthEdges,
  personas,
  sections,
  sectionLabels,
  temperaments,
  traitsData,
  typeMatches,
  type Section,
  type TemperamentName,
  type Trait,
  type TraitCategory,
} from '../data/personality';

function getIntensity(diff: number) {
  if (diff <= 10) return 'balanced';
  if (diff <= 25) return 'leaning';
  if (diff <= 50) return 'strong';
  return 'defining';
}

interface TraitBarProps {
  trait: Trait;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function TraitBar({ trait, index, isExpanded, onToggle }: TraitBarProps) {
  const diff = Math.abs(trait.leftPct - trait.rightPct);
  const intensity = getIntensity(diff);
  const leftDominant = trait.leftPct >= trait.rightPct;
  const meta = categoryMeta[trait.category];

  return (
    <div
      onClick={onToggle}
      style={{
        cursor: 'pointer',
        padding: '14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        animation: `fadeIn 0.5s ease ${index * 0.04}s both`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", color: leftDominant ? '#2E2A25' : '#A09890', fontWeight: leftDominant ? 700 : 400 }}>{trait.left}</span>
          {leftDominant && <span style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", color: meta.color, fontWeight: 600 }}>{trait.leftPct}%</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {!leftDominant && <span style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", color: meta.color, fontWeight: 600 }}>{trait.rightPct}%</span>}
          <span style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", color: !leftDominant ? '#2E2A25' : '#A09890', fontWeight: !leftDominant ? 700 : 400 }}>{trait.right}</span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: meta.track }}>
        <div style={{ width: `${trait.leftPct}%`, background: leftDominant ? meta.color : meta.muted, borderRadius: '6px 0 0 6px', transition: 'width 0.6s ease' }} />
        <div style={{ width: 2, background: '#fff' }} />
        <div style={{ width: `${trait.rightPct}%`, background: !leftDominant ? meta.color : meta.muted, borderRadius: '0 6px 6px 0', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ marginTop: 6, textAlign: 'center', fontSize: 10.5, color: '#B5AFA6', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{intensity}</div>
      {isExpanded && (
        <div style={{ marginTop: 8, padding: '10px 14px', background: meta.track, borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, color: '#5A554E', fontFamily: "'Cormorant Garamond', serif" }}>
          <span style={{ color: meta.color, fontWeight: 700 }}>{trait.dominant}</span> at {trait.dominantPct}%
          {diff <= 10 && ' — you shift between both sides fluidly. This is a tension, not a destination.'}
          {diff > 10 && diff <= 25 && ' — a clear lean, but you can access the other side when needed.'}
          {diff > 25 && diff <= 50 && ' — this colors how you show up. People notice it.'}
          {diff > 50 && diff <= 70 && ' — this is a defining trait. It shapes your decisions and relationships.'}
          {diff > 70 && " — this isn't a preference. It's an operating system."}
        </div>
      )}
    </div>
  );
}

function SignatureTraits() {
  const sorted = [...traitsData].sort((a, b) => Math.abs(b.leftPct - b.rightPct) - Math.abs(a.leftPct - a.rightPct));
  const top5 = sorted.slice(0, 5);
  const balanced = sorted.filter((t) => Math.abs(t.leftPct - t.rightPct) <= 10);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A09890', fontFamily: "'Source Sans 3', sans-serif", marginBottom: 12, fontWeight: 500 }}>Your Strongest Colors</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {top5.map((t) => {
          const meta = categoryMeta[t.category];
          return (
            <div key={t.facet} style={{ padding: '8px 18px', borderRadius: 8, background: meta.color, color: '#fff', fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              {t.dominant} <span style={{ opacity: 0.7, fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", fontWeight: 400 }}>{t.dominantPct}%</span>
            </div>
          );
        })}
      </div>
      {balanced.length > 0 && (
        <>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A09890', fontFamily: "'Source Sans 3', sans-serif", marginBottom: 10, fontWeight: 500 }}>Where You're Split</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {balanced.map((t) => (
              <div key={t.facet} style={{ padding: '6px 14px', borderRadius: 8, background: '#F0EBE3', border: '1px solid #DDD7CD', fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#7A756E' }}>
                {t.left} ↔ {t.right}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DescriptorBars() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {descriptors.map((d, i) => {
        const hue = d.pct >= 70 ? '#4A7FB5' : d.pct >= 50 ? '#7EA87A' : '#C8C0B4';
        return (
          <div key={d.word} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `fadeIn 0.4s ease ${i * 0.03}s both` }}>
            <span style={{ width: 100, fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#4A453E', fontWeight: d.pct >= 60 ? 700 : 400, textAlign: 'right' }}>{d.word}</span>
            <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#F0EBE3' }}>
              <div style={{ width: `${d.pct}%`, height: '100%', borderRadius: 5, background: hue, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ width: 30, fontSize: 11, fontFamily: "'Source Sans 3', sans-serif", color: '#A09890', fontWeight: 500 }}>{d.pct}</span>
          </div>
        );
      })}
    </div>
  );
}

function TemperamentSection() {
  const colors: Record<TemperamentName, string> = {
    Empath: '#9E6B9B',
    Theorist: '#4A7FB5',
    Responder: '#CD8245',
    Preserver: '#5E9E58',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {temperaments.map((t, i) => (
        <div key={t.name} style={{ animation: `fadeIn 0.4s ease ${i * 0.08}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: colors[t.name] }}>{t.name}</span>
            <span style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: colors[t.name] }}>{t.pct}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: '#F0EBE3' }}>
            <div style={{ width: `${t.pct}%`, height: '100%', borderRadius: 5, background: colors[t.name], transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, fontFamily: "'Cormorant Garamond', serif", color: '#8A857E', fontStyle: 'italic' }}>{t.desc}</div>
        </div>
      ))}
    </div>
  );
}

function TypeMatchSection() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {typeMatches.map((t, i) => {
        const isTop = t.pct >= 68;
        return (
          <div
            key={t.code}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: isTop ? '#fff' : '#FAF7F2',
              border: isTop ? '2px solid #4A7FB5' : '1px solid #E8E2D8',
              boxShadow: isTop ? '0 2px 8px rgba(74,127,181,0.12)' : 'none',
              animation: `fadeIn 0.4s ease ${i * 0.06}s both`,
            }}
          >
            <div style={{ fontSize: 20, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: isTop ? '#4A7FB5' : '#7A756E' }}>{t.code}</div>
            <div style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", color: '#A09890', marginTop: 2 }}>{t.name}</div>
            <div style={{ fontSize: 24, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: isTop ? '#4A7FB5' : '#B5AFA6', marginTop: 6 }}>{t.pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function ConvergenceSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#7A756E', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 4 }}>
        Where MBTI, Big Five, Numerology, and Enneagram all point the same direction.
      </div>
      {convergenceThemes.map((t, i) => (
        <div
          key={t.title}
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #E8E2D8',
            borderLeft: `4px solid ${t.color}`,
            animation: `fadeIn 0.4s ease ${i * 0.08}s both`,
          }}
        >
          <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: t.color, marginBottom: 4 }}>{t.title}</div>
          <div style={{ fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#5A554E', lineHeight: 1.6 }}>{t.desc}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A09890', fontFamily: "'Source Sans 3', sans-serif", marginTop: 8, fontWeight: 500 }}>Growth Edges</div>
      {growthEdges.map((g, i) => (
        <div
          key={g.title}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#FDF8F0',
            border: '1px solid #E8DFD0',
            animation: `fadeIn 0.4s ease ${(i + 4) * 0.08}s both`,
          }}
        >
          <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: '#CD8245', marginBottom: 4 }}>{g.title}</div>
          <div style={{ fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#5A554E', lineHeight: 1.6 }}>{g.desc}</div>
        </div>
      ))}
    </div>
  );
}

function PersonaSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#7A756E', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 4 }}>
        Three named internal personas — a framework for self-awareness and role clarity.
      </div>
      {personas.map((p, i) => (
        <div
          key={p.name}
          style={{
            padding: '16px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #E8E2D8',
            animation: `fadeIn 0.4s ease ${i * 0.1}s both`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: p.color }}>{p.name}</span>
            <span style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", color: '#A09890' }}>{p.role}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 13.5, fontFamily: "'Cormorant Garamond', serif", color: '#5A554E', lineHeight: 1.6 }}>{p.desc}</div>
        </div>
      ))}
      <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 10, background: '#F5F0E8', border: '1px solid #E0D8CC' }}>
        <div style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Life Path 23/5</div>
        <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: '#CD8245', marginBottom: 4 }}>The Philosopher-Warrior</div>
        <div style={{ fontSize: 13, fontFamily: "'Cormorant Garamond', serif", color: '#5A554E', lineHeight: 1.6, fontStyle: 'italic' }}>
          Freedom through truth and mastery of voice. Here to speak truth to power, break generational silence, and turn chaos into sacred architecture.
        </div>
      </div>
    </div>
  );
}

const MBTI_LETTERS: { letter: string; pct: number; label: string; color: string }[] = [
  { letter: 'E', pct: 51, label: 'Extraversion', color: '#5E9E58' },
  { letter: 'N', pct: 73, label: 'Intuition', color: '#4A7FB5' },
  { letter: 'F', pct: 50, label: 'Feeling', color: '#9E6B9B' },
  { letter: 'P', pct: 63, label: 'Perceiving', color: '#CD8245' },
];

export const PersonalityView = () => {
  const [activeSection, setActiveSection] = useState<Section>('traits');
  const [activeCategory, setActiveCategory] = useState<'all' | TraitCategory>('all');
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const filtered = activeCategory === 'all' ? traitsData : traitsData.filter((t) => t.category === activeCategory);

  return (
    <div
      style={{
        background: '#FDFBF7',
        color: '#2E2A25',
        fontFamily: "'Cormorant Garamond', serif",
        padding: '40px 20px',
        borderRadius: 16,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ marginBottom: 36, textAlign: 'center', animation: 'fadeIn 0.5s ease both' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#B5AFA6', marginBottom: 10, fontFamily: "'Source Sans 3', sans-serif" }}>Complete Personality Profile</div>
          <h1 style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.1, marginBottom: 6, color: '#2E2A25', fontStyle: 'italic' }}>Paul Brown</h1>
          <div style={{ fontSize: 14, color: '#9E9A94', fontStyle: 'italic', fontWeight: 300 }}>ENFP · 23/5 · Philosopher-Warrior</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 32, justifyContent: 'center', animation: 'fadeIn 0.5s ease 0.08s both' }}>
          {MBTI_LETTERS.map((d) => (
            <div key={d.letter} style={{ textAlign: 'center', padding: '16px 14px', background: '#fff', borderRadius: 10, border: '1px solid #E8E2D8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', minWidth: 68 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: d.color, lineHeight: 1 }}>{d.letter}</div>
              <div style={{ fontSize: 11, color: '#A09890', marginTop: 4, fontFamily: "'Source Sans 3', sans-serif", fontWeight: 500 }}>{d.pct}%</div>
              <div style={{ fontSize: 9, color: '#C0B8AD', marginTop: 2, fontFamily: "'Source Sans 3', sans-serif" }}>{d.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeIn 0.5s ease 0.12s both' }}>
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: activeSection === s ? '1px solid #2E2A25' : '1px solid #E8E2D8',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                background: activeSection === s ? '#2E2A25' : '#fff',
                color: activeSection === s ? '#fff' : '#7A756E',
                transition: 'all 0.2s ease',
              }}
            >
              {sectionLabels[s]}
            </button>
          ))}
        </div>

        <div style={{ animation: 'fadeIn 0.4s ease both' }}>
          {activeSection === 'traits' && (
            <>
              <SignatureTraits />
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #E8E2D8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    background: activeCategory === 'all' ? '#2E2A25' : '#fff',
                    color: activeCategory === 'all' ? '#fff' : '#7A756E',
                  }}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const meta = categoryMeta[cat];
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: `1px solid ${active ? meta.color : '#E8E2D8'}`,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 600,
                        background: active ? meta.color : '#fff',
                        color: active ? '#fff' : '#7A756E',
                      }}
                    >
                      {meta.icon} {meta.label}
                    </button>
                  );
                })}
              </div>
              {activeCategory === 'all' ? (
                categories.map((cat) => {
                  const meta = categoryMeta[cat];
                  const catTraits = filtered.filter((t) => t.category === cat);
                  return (
                    <div key={cat} style={{ marginBottom: 28 }}>
                      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: meta.color, marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Source Sans 3', sans-serif" }}>
                        <span style={{ fontSize: 14 }}>{meta.icon}</span> {meta.label}
                      </div>
                      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', border: '1px solid #E8E2D8', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
                        {catTraits.map((trait, i) => (
                          <TraitBar
                            key={trait.facet}
                            trait={trait}
                            index={i}
                            isExpanded={expandedTrait === trait.facet}
                            onToggle={() => setExpandedTrait(expandedTrait === trait.facet ? null : trait.facet)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', border: '1px solid #E8E2D8', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
                  {filtered.map((trait, i) => (
                    <TraitBar
                      key={trait.facet}
                      trait={trait}
                      index={i}
                      isExpanded={expandedTrait === trait.facet}
                      onToggle={() => setExpandedTrait(expandedTrait === trait.facet ? null : trait.facet)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {activeSection === 'descriptors' && <DescriptorBars />}
          {activeSection === 'temperament' && <TemperamentSection />}
          {activeSection === 'types' && <TypeMatchSection />}
          {activeSection === 'convergence' && <ConvergenceSection />}
          {activeSection === 'personas' && <PersonaSection />}
        </div>

        <div style={{ marginTop: 40, paddingTop: 16, fontSize: 10.5, color: '#C0B8AD', fontFamily: "'Source Sans 3', sans-serif", textAlign: 'center', fontWeight: 400, fontStyle: 'italic' }}>
          TypeFinder® Assessment · Life Path 23/5 · Systems Convergence Analysis · March 2024
        </div>
      </div>
    </div>
  );
};
