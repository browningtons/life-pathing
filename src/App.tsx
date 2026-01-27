import React, { useState, useEffect } from 'react';
import logo from "./assets/logo.png";
import { 
  Sparkles, 
  Layers,
  Star,
  Users,
  Gem,
  Briefcase,
  Target,
  Heart,
  Brain,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldAlert,
  Ghost,
  Calendar
} from 'lucide-react';

// --- Data ---

const COMPOUND_MEANINGS: Record<number, string> = {
  10: "The Wheel of Fortune",
  11: "The Lion Muzzled (Master Number)",
  12: "The Sacrifice / The Victim",
  13: "Regeneration & Change",
  14: "Movement & Challenge",
  15: "The Magician",
  16: "The Tower / The Shattered Citadel",
  17: "The Star of the Magi",
  18: "Spiritual-Material Conflict",
  19: "The Prince of Heaven",
  20: "The Awakening",
  21: "The Crown of the Magi",
  22: "Submission & Caution (Master Number)",
  23: "The Royal Star of the Lion",
  24: "Love, Money, Creativity",
  25: "Discrimination & Analysis",
  26: "Partnerships",
  27: "The Sceptre",
  28: "The Trusting Lamb",
  29: "Uncertainty & Deception",
  30: "The Loner",
  31: "The Recluse",
  32: "Communication",
  33: "The Master Teacher (Master Number)"
};

const LIFE_PATH_MEANINGS: Record<number, any> = {
  1: { 
    title: "The Leader", 
    keywords: "Independent, Original, Ambitious", 
    description: "You are here to master yourself and lead others. You are a pioneer with innovative ideas. You operate best when you are in charge or working independently.", 
    purpose: "To develop self-reliance, will-power, and integrity. Your path is learning to stand on your own two feet and trust your unique vision.",
    love: "You need a partner who is independent and self-sufficient. You can be protective, but must watch out for being too controlling.",
    career: "Entrepreneur, CEO, Manager, Inventor, Freelancer, Director.",
    light: ["Unstoppable determination", "Original thinker", "Courageous pioneer", "Self-reliant", "Natural authority"],
    shadow_list: ["Stubbornness & rigidity", "Fear of dependency", "Aggression when blocked", "Ego-centric behavior", "Difficulty asking for help"],
    famous: ["Steve Jobs", "Martin Luther King Jr.", "Scarlett Johansson", "Henry Ford", "Tom Hanks", "George Lucas"],
  },
  2: { 
    title: "The Peacemaker", 
    keywords: "Intuitive, Supportive, Diplomatic", 
    description: "You are the glue that holds people together. Your gift is seeing all sides of a situation. You thrive in partnerships and environments where cooperation is valued.", 
    purpose: "To learn the art of patience, cooperation, and diplomacy. Your path is about finding balance and harmony in relationships.",
    love: "You are deeply devoted and romantic. You need reassurance and harmony at home. Conflict is physically draining for you.",
    career: "Counselor, Diplomat, Healer, Teacher, Assistant, Mediator.",
    light: ["Deeply intuitive", "Master diplomat", "Patient & supportive", "Detail-oriented", "Empathetic listener"],
    shadow_list: ["Over-sensitivity", "Indecisiveness", "Passive-aggressiveness", "Self-sacrifice", "Fear of being alone"],
    famous: ["Barack Obama", "Jennifer Aniston", "Madonna", "Tony Robbins", "Meg Ryan", "Kanye West"],
  },
  3: { 
    title: "The Creative", 
    keywords: "Expressive, Verbal, Optimistic", 
    description: "You are here to express yourself and uplift the world with your joy and creativity. You have a gift with words and a magnetic personality.", 
    purpose: "To bring joy and inspiration to others through self-expression. Your path is to find your voice and speak your truth.",
    love: "You are fun, flirty, and charming. You need a partner who stimulates you mentally and allows you social freedom.",
    career: "Actor, Writer, Musician, Sales, Marketing, Designer.",
    light: ["Charismatic storyteller", "Eternal optimist", "Artistic genius", "Social magnet", "Inspiring communicator"],
    shadow_list: ["Scattered energy", "Superficiality", "Exaggeration/Gossip", "Mood swings", "Avoiding depth"],
    famous: ["David Bowie", "Frida Kahlo", "Cameron Diaz", "Snoop Dogg", "Charles Dickens", "Jackie Chan"],
  },
  4: { 
    title: "The Builder", 
    keywords: "Grounded, Practical, Reliable", 
    description: "You are the foundation. You build systems and structures that last. You are disciplined, honest, and hardworking.", 
    purpose: "To build a sense of stability and security in the world. Your path is one of step-by-step progress and creating order from chaos.",
    love: "You are loyal and take commitment seriously. You show love through acts of service and providing security rather than grand emotional displays.",
    career: "Engineer, Architect, Accountant, Project Manager, Real Estate.",
    light: ["Rock-solid reliability", "Master of systems", "Disciplined worker", "Honest & loyal", "Practical problem solver"],
    shadow_list: ["Rigidity", "Fear of change", "Stubbornness", "Workaholism", "Lack of imagination"],
    famous: ["Bill Gates", "Oprah Winfrey", "Brad Pitt", "Elton John", "Margaret Thatcher", "Arnold Schwarzenegger"],
  },
  5: { 
    title: "The Adventurer", 
    keywords: "Dynamic, Freedom-loving, Versatile", 
    description: "You are a catalyst for change. You thrive on variety, sensory experiences, and freedom. Routine is your enemy.", 
    purpose: "To learn the constructive use of freedom. Your path is to embrace change and show others how to live fearlessly.",
    love: "You are passionate and exciting, but you need space. A partner who tries to cage you will lose you quickly.",
    career: "Travel, Media, Sales, Consulting, Entertainment, Event Planning.",
    light: ["Fearless change-maker", "Versatile & adaptable", "Magnetic personality", "Visionary thinker", "Lover of freedom"],
    shadow_list: ["Restlessness", "Impulsiveness", "Inconsistency", "Fear of commitment", "Over-indulgence"],
    famous: ["Gautama Buddha", "Angelina Jolie", "Mick Jagger", "Beyoncé", "Abraham Lincoln", "Steven Spielberg"],
  },
  6: { 
    title: "The Nurturer", 
    keywords: "Responsible, Caring, Protective", 
    description: "You are the heart of the home and community. You serve through love and harmony. You often feel responsible for everyone around you.", 
    purpose: "To provide vision and acceptance. Your path is to learn the balance between helping others and helping yourself.",
    love: "You are the marrying type. Home and family are your top priority. You can be idealistically demanding of partners.",
    career: "Teacher, Nurse, Counselor, Interior Design, Artist, Healer.",
    light: ["Unconditional love", "Natural healer/counselor", "Responsible protector", "Community builder", "Eye for beauty"],
    shadow_list: ["Meddling/Interfering", "Perfectionism", "Self-righteousness", "Martyr complex", "Difficulty saying no"],
    famous: ["Michael Jackson", "Albert Einstein", "Robert De Niro", "Eleanor Roosevelt", "Stephen King", "Eddie Murphy"],
  },
  7: { 
    title: "The Seeker", 
    keywords: "Analytical, Mystical, Intellectual", 
    description: "You are a truth-seeker. You bridge the gap between the scientific and the spiritual. You need periods of solitude to recharge.", 
    purpose: "To develop trust and faith. Your path is to analyze the mysteries of life and find your own spiritual truth.",
    love: "You can be hard to get to know. You need a partner who respects your need for quiet and intellectual depth.",
    career: "Scientist, Researcher, Philosopher, Writer, Mystic, Investigator.",
    light: ["Deep wisdom", "Analytical genius", "Spiritual intuition", "Independent thinker", "Truth seeker"],
    shadow_list: ["Isolation/Withdrawal", "Cynicism", "Over-thinking", "Secretive nature", "Social awkwardness"],
    famous: ["Johnny Depp", "Julia Roberts", "Princess Diana", "Leonardo DiCaprio", "Marilyn Monroe", "Queen Elizabeth II"],
  },
  8: { 
    title: "The Powerhouse", 
    keywords: "Ambitious, Material, Strong", 
    description: "You are here to master the material world. You understand money, power, and authority. You are a natural executive.", 
    purpose: "To learn the satisfaction of the material world and the use of power for the good of all.",
    love: "You value status and strength in a partner. You are loyal and protective, but need to be careful not to treat relationships like business deals.",
    career: "CEO, Finance, Law, Executive, Business Owner, Publisher.",
    light: ["Executive ability", "Financial abundance", "Personal power", "Resilience", "Visionary leadership"],
    shadow_list: ["Greed/Materialism", "Domination/Control", "Intimidation", "Workaholism", "Neglecting emotions"],
    famous: ["Pablo Picasso", "Sandra Bullock", "Matt Damon", "Martha Stewart", "Nelson Mandela", "Jason Statham"],
  },
  9: { 
    title: "The Humanitarian", 
    keywords: "Compassionate, Generous, Idealistic", 
    description: "You are here to let go and serve the greater good. You often attract people who need help.", 
    purpose: "To learn the law of letting go. Your path is to inspire others by your example of compassion and tolerance.",
    love: "You are romantic and giving, but can be distant if you feel your freedom is threatened. You love humanity, sometimes more than individuals.",
    career: "Non-profit, HR, Artist, Doctor, Writer, Philanthropist.",
    light: ["Universal compassion", "Global consciousness", "Artistic talent", "Generosity", "Wisdom of experience"],
    shadow_list: ["Resentment", "Martyrdom", "Emotional aloofness", "Difficulty letting go", "Aimless dreaming"],
    famous: ["Mahatma Gandhi", "Mother Teresa", "Morgan Freeman", "Bob Marley", "Jim Carrey", "Harrison Ford"],
  },
  11: { 
    title: "The Illuminator", 
    keywords: "Intuitive, Spiritual, Inspiring", 
    description: "You are a channel for higher wisdom. You inspire others through your presence. You have high standards for yourself and others.", 
    purpose: "To be a source of inspiration and illumination. Your path involves using your intuition to help others.",
    love: "You are highly sensitive and need a partner who understands your spiritual nature. You seek a soulmate connection.",
    career: "Spiritual Teacher, Media, Inventor, Psychologist, Artist.",
    light: ["Psychic intuition", "Spiritual teacher", "Charismatic leader", "Visionary peace-maker", "Electric presence"],
    shadow_list: ["Nervous tension", "Impracticality", "Hypersensitivity", "Self-criticism", "Overwhelmed by energy"],
    famous: ["Michelle Obama", "Harry Houdini", "Derren Brown", "Lucy Liu", "Orlando Bloom", "Michael Jordan"],
  },
  22: { 
    title: "The Master Builder", 
    keywords: "Visionary, Practical, Powerful", 
    description: "You turn dreams into reality. You have the vision of the 11 and the practicality of the 4. You can achieve enormous success.", 
    purpose: "To manifest high ideals into practical reality. Your path is to build something that benefits humanity on a large scale.",
    love: "You need a supportive partner who can handle your ambition and power. You are loyal and stable.",
    career: "International Business, Politics, Architecture, Global Leadership.",
    light: ["Manifestation master", "Global impact", "Practical genius", "Diplomatic leader", "Legacy builder"],
    shadow_list: ["Fear of failure", "Overwhelmed by potential", "Controlling", "Laziness (fear of work)", "Indifference"],
    famous: ["Paul McCartney", "Will Smith", "Dalai Lama (14th)", "Sir Richard Branson", "Bryan Adams"],
  },
  33: { 
    title: "The Master Teacher", 
    keywords: "Selfless, Healing, Guiding", 
    description: "You focus on spiritual upliftment of humanity. You operate from a place of pure love and have a nurturing essence.", 
    purpose: "To teach the power of love. Your path is one of selfless service and healing.",
    love: "You love deeply and protectively. You need a partner who appreciates your caring nature but doesn't take advantage of it.",
    career: "Healing Arts, Ministry, Teaching, Counseling, Community Service.",
    light: ["Cosmic parent", "Selfless service", "Master healer", "Compassionate guide", "Joyful spirit"],
    shadow_list: ["Burdened by others", "Emotional volatility", "Perfectionism", "Neglecting self", "Martyrdom"],
    famous: ["Meryl Streep", "Francis Ford Coppola", "Salma Hayek", "Robert De Niro", "Stephen King", "John Lennon"],
  }
};

const MBTI_DATA: Record<string, any> = {
  INFP: {
    title: "The Healer",
    archetype: "The Dreamer",
    drive: "Authenticity & Meaning",
    stack: ["Fi", "Ne", "Si", "Te"],
    desc: "Poetic, kind, and altruistic people, always eager to help a good cause. You are guided by your principles rather than logic or excitement.",
    strengths: ["Deeply Empathetic", "Open-Minded", "Creative", "Passionate", "Idealistic"],
    strength_tip: "Your authenticity is your magnet. Don't hide your quirkiness; it is exactly what draws your true tribe to you.",
    shadows: ["Unrealistic Expectations", "Isolating", "Unfocused", "Emotionally Vulnerable", "Self-Critical"],
    growth: "Balance your idealism with action. Don't just dream of a better world; take small, concrete steps to build it.",
    famous: ["J.R.R. Tolkien", "William Shakespeare", "Björk", "Johnny Depp", "Princess Diana"]
  },
  INFJ: {
    title: "The Advocate",
    archetype: "The Mystic",
    drive: "Insight & Harmony",
    stack: ["Ni", "Fe", "Ti", "Se"],
    desc: "Quiet and mystical, yet very inspiring and tireless idealists. You see patterns others miss and strive to help others realize their potential.",
    strengths: ["Insightful", "Principled", "Passionate", "Altruistic", "Creative"],
    strength_tip: "Trust your gut. Your intuition often knows the answer long before your logic can explain why.",
    shadows: ["Sensitive to Criticism", "Perfectionistic", "Privacy-Obsessed", "Burnout Prone", "Always Need a Cause"],
    growth: "Remember that you cannot pour from an empty cup. Protect your boundaries as fiercely as you protect others.",
    famous: ["Martin Luther King Jr.", "Nelson Mandela", "Mother Teresa", "Lady Gaga", "Nicole Kidman"]
  },
  INTJ: {
    title: "The Architect",
    archetype: "The Strategist",
    drive: "Mastery & Competence",
    stack: ["Ni", "Te", "Fi", "Se"],
    desc: "Imaginative and strategic thinkers, with a plan for everything. You value intellect and competence above all else.",
    strengths: ["Rational", "Informed", "Independent", "Determined", "Curious"],
    strength_tip: "Your vision is a superpower. Trust your ability to see the chess moves ten steps ahead of everyone else.",
    shadows: ["Arrogant", "Dismissive of Emotions", "Overly Critical", "Combative", "Socially Clueless"],
    growth: "Learn to value the emotional and social components of life. Not everything can be solved with logic alone.",
    famous: ["Elon Musk", "Christopher Nolan", "Michelle Obama", "Friedrich Nietzsche", "Arnold Schwarzenegger"]
  },
  INTP: {
    title: "The Logician",
    archetype: "The Thinker",
    drive: "Understanding & Truth",
    stack: ["Ti", "Ne", "Si", "Fe"],
    desc: "Innovative inventors with an unquenchable thirst for knowledge. You love patterns and spotting discrepancies.",
    strengths: ["Analytical", "Original", "Open-Minded", "Curious", "Objective"],
    strength_tip: "Your brain is a unique problem-solving engine. Give yourself permission to explore ideas that others find 'weird'.",
    shadows: ["Disconnected", "Insensitive", "Dissatisfied", "Impatient", "Fear of Failure"],
    growth: "Connect with others emotionally. Your brilliant ideas need people to bring them to life.",
    famous: ["Albert Einstein", "Bill Gates", "Kristen Stewart", "Avicii", "Descartes"]
  },
  ENFP: {
    title: "The Campaigner",
    archetype: "The Inspirer",
    drive: "Connection & Possibility",
    stack: ["Ne", "Fi", "Te", "Si"],
    desc: "Enthusiastic, creative and sociable free spirits, who can always find a reason to smile.",
    strengths: ["Curious", "Observant", "Energetic and Enthusiastic", "Excellent Communicator", "Know How to Relax"],
    strength_tip: "Your enthusiasm is contagious. Use it to spark movements and inspire those who are stuck.",
    shadows: ["Poor Practical Skills", "Find it Difficult to Focus", "Overthink Things", "Get Stressed Easily", "Highly Emotional"],
    growth: "Focus is your friend. Follow through on one idea before jumping to the next to see true results.",
    famous: ["Robert Downey Jr.", "Robin Williams", "Will Smith", "Walt Disney", "Quentin Tarantino"]
  },
  ESTJ: { 
      title: "The Executive", 
      archetype: "The Supervisor", 
      drive: "Order & Structure", 
      stack: ["Te", "Si", "Ne", "Fi"], 
      desc: "Excellent administrators, unsurpassed at managing things or people.", 
      strengths: ["Dedicated", "Strong-willed", "Direct", "Honest", "Loyal"], 
      strength_tip: "Your ability to create order is a gift. You make the chaotic world safe for others.",
      shadows: ["Inflexible", "Judgmental", "Difficult Relaxing", "Too Focused on Status"], 
      growth: "Practice patience with those who don't follow the rules as strictly as you do.", 
      famous: ["Judge Judy", "Frank Sinatra"] 
  },
};

const getMbtiData = (type) => {
  return MBTI_DATA[type] || {
    title: "The Personality",
    archetype: "The Individual",
    drive: "To Be Known",
    stack: ["X", "Y", "Z", "A"],
    desc: "A unique combination of traits that defines your interaction with the world.",
    strengths: ["Adaptable", "Unique", "Capable"],
    strength_tip: "Lean into your natural talents.",
    shadows: ["Uncertainty", "Imbalance"],
    growth: "Explore your cognitive functions to understand your true potential.",
    famous: []
  };
};

const DIMENSION_TOOLTIPS = {
  ie: "Energy Source: Introverts (I) recharge in solitude; Extroverts (E) recharge through social interaction.",
  sn: "Information Processing: Sensors (S) focus on facts & details; Intuitives (N) focus on ideas & possibilities.",
  tf: "Decision Making: Thinkers (T) prioritize logic & objectivity; Feelers (F) prioritize values & harmony.",
  jp: "Structure: Judgers (J) prefer plans & closure; Perceivers (P) prefer flexibility & spontaneity."
};

// Calculations
const calculateLifePath = (dateString) => {
  if (!dateString) return { number: 0, breakdown: { y: 0, m: 0, d: 0, rawY: '', rawM: '', rawD: '' }, compound: 0 };
  const parts = dateString.split('-');
  if (parts.length !== 3) return { number: 0, breakdown: { y: 0, m: 0, d: 0, rawY: '', rawM: '', rawD: '' }, compound: 0 };
  const [year, month, day] = parts;
  const reduce = (val) => {
    let n = parseInt(val);
    if (isNaN(n)) return 0;
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce((acc, curr) => acc + parseInt(curr), 0);
    }
    return n;
  };
  const getSum = (val) => String(val).split('').reduce((acc, c) => acc + parseInt(c), 0);
  const ySum = getSum(year);
  const mSum = getSum(month);
  const dSum = getSum(day);
  const rYear = reduce(year);
  const rMonth = reduce(month);
  const rDay = reduce(day);
  let sum = rYear + rMonth + rDay;
  const compound = sum;
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').reduce((acc, curr) => acc + parseInt(curr), 0);
  }
  return { number: sum, compound: compound, breakdown: { y: rYear, m: rMonth, d: rDay, rawY: year, rawM: month, rawD: day, ySum, mSum, dSum } };
};

// --- Components ---

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CosmicBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-xl ${color} w-full`}>
    <Icon size={18} className="mb-1 opacity-80" />
    <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider">{label}</span>
    <span className="text-sm font-bold text-center leading-tight">{value}</span>
  </div>
);

const ElementalBar = ({ label, percent, color, icon: Icon }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
      <div className="flex items-center gap-2">
        <Icon size={12} className={color.text} />
        <span>{label}</span>
      </div>
      <span>{percent}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color.bg}`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

// --- Sub-Views ---

const ArchetypesView = ({ initialType, onTypeChange }) => {
  const [type, setType] = useState({
    ie: initialType[0] || 'I',
    sn: initialType[1] || 'N',
    tf: initialType[2] || 'F',
    jp: initialType[3] || 'P'
  });

  useEffect(() => {
    if (initialType) {
        setType({
            ie: initialType[0] || 'I',
            sn: initialType[1] || 'N',
            tf: initialType[2] || 'F',
            jp: initialType[3] || 'P'
        });
    }
  }, [initialType]);

  const currentTypeString = `${type.ie}${type.sn}${type.tf}${type.jp}`;
  const data = getMbtiData(currentTypeString);

  useEffect(() => {
      onTypeChange(currentTypeString);
  }, [currentTypeString, onTypeChange]);

  const toggle = (dim) => {
    setType(prev => {
      let next = { ...prev };
      if (dim === 'ie') next.ie = prev.ie === 'I' ? 'E' : 'I';
      if (dim === 'sn') next.sn = prev.sn === 'S' ? 'N' : 'S';
      if (dim === 'tf') next.tf = prev.tf === 'T' ? 'F' : 'T';
      if (dim === 'jp') next.jp = prev.jp === 'J' ? 'P' : 'J';
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header / Selector */}
      <Card className="bg-indigo-900 !bg-indigo-900 text-white border-indigo-800 !border-indigo-800 relative">
         {/* Background clipped container */}
         <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
         </div>
         {/* Content with z-10 */}
         <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
               <div className="flex items-center gap-3 mb-2 opacity-80">
                  <Brain size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Cognitive Architecture</span>
               </div>
               <h2 className="text-4xl font-bold mb-2">{currentTypeString}</h2>
               <h3 className="text-xl text-indigo-300 font-medium mb-4">{data.title}</h3>
               <p className="text-sm text-indigo-100/80 leading-relaxed max-w-md">
                  {data.desc}
               </p>
            </div>

            {/* Toggles */}
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 grid grid-cols-2 gap-4">
               
               {/* I/E Toggle */}
               <button onClick={() => toggle('ie')} className="flex flex-col items-center p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors relative group">
                  <div className="absolute top-2 right-2">
                     <div className="group relative">
                        <HelpCircle size={14} className="text-white/30 hover:text-white" />
                        <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-50 shadow-lg">
                           {DIMENSION_TOOLTIPS.ie}
                        </div>
                     </div>
                  </div>
                  <span className="text-xs opacity-50 mb-1">Energy</span>
                  <div className="flex items-center gap-2 font-bold">
                     <span className={type.ie === 'I' ? 'text-white' : 'text-white/30'}>I</span>
                     <div className="w-8 h-4 bg-white/20 rounded-full relative">
                        <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${type.ie === 'I' ? 'left-0.5' : 'right-0.5'}`} />
                     </div>
                     <span className={type.ie === 'E' ? 'text-white' : 'text-white/30'}>E</span>
                  </div>
               </button>

               {/* S/N Toggle */}
               <button onClick={() => toggle('sn')} className="flex flex-col items-center p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors relative group">
                  <div className="absolute top-2 right-2">
                     <div className="group relative">
                        <HelpCircle size={14} className="text-white/30 hover:text-white" />
                        <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-50 shadow-lg">
                           {DIMENSION_TOOLTIPS.sn}
                        </div>
                     </div>
                  </div>
                  <span className="text-xs opacity-50 mb-1">Mind</span>
                  <div className="flex items-center gap-2 font-bold">
                     <span className={type.sn === 'S' ? 'text-white' : 'text-white/30'}>S</span>
                     <div className="w-8 h-4 bg-white/20 rounded-full relative">
                        <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${type.sn === 'S' ? 'left-0.5' : 'right-0.5'}`} />
                     </div>
                     <span className={type.sn === 'N' ? 'text-white' : 'text-white/30'}>N</span>
                  </div>
               </button>

               {/* T/F Toggle */}
               <button onClick={() => toggle('tf')} className="flex flex-col items-center p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors relative group">
                  <div className="absolute top-2 right-2">
                     <div className="group relative">
                        <HelpCircle size={14} className="text-white/30 hover:text-white" />
                        <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-50 shadow-lg">
                           {DIMENSION_TOOLTIPS.tf}
                        </div>
                     </div>
                  </div>
                  <span className="text-xs opacity-50 mb-1">Nature</span>
                  <div className="flex items-center gap-2 font-bold">
                     <span className={type.tf === 'T' ? 'text-white' : 'text-white/30'}>T</span>
                     <div className="w-8 h-4 bg-white/20 rounded-full relative">
                        <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${type.tf === 'T' ? 'left-0.5' : 'right-0.5'}`} />
                     </div>
                     <span className={type.tf === 'F' ? 'text-white' : 'text-white/30'}>F</span>
                  </div>
               </button>

               {/* J/P Toggle */}
               <button onClick={() => toggle('jp')} className="flex flex-col items-center p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors relative group">
                  <div className="absolute top-2 right-2">
                     <div className="group relative">
                        <HelpCircle size={14} className="text-white/30 hover:text-white" />
                        <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-50 shadow-lg">
                           {DIMENSION_TOOLTIPS.jp}
                        </div>
                     </div>
                  </div>
                  <span className="text-xs opacity-50 mb-1">Tactics</span>
                  <div className="flex items-center gap-2 font-bold">
                     <span className={type.jp === 'J' ? 'text-white' : 'text-white/30'}>J</span>
                     <div className="w-8 h-4 bg-white/20 rounded-full relative">
                        <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${type.jp === 'J' ? 'left-0.5' : 'right-0.5'}`} />
                     </div>
                     <span className={type.jp === 'P' ? 'text-white' : 'text-white/30'}>P</span>
                  </div>
               </button>
            </div>
         </div>
      </Card>

      {/* Cognitive Stack */}
      <Card className="bg-white border-slate-100">
         <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Functional Stack</h3>
            <div className="group relative">
               <HelpCircle size={14} className="text-slate-400 hover:text-indigo-500 cursor-help" />
               <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg hidden group-hover:block z-50 shadow-xl">
                  <strong>The Engine Under the Hood.</strong> Your stack determines how you process the world.
                  <br/><br/>
                  1. <strong>Dominant (Hero):</strong> Your automatic flow state.<br/>
                  2. <strong>Auxiliary (Parent):</strong> Supports the hero.<br/>
                  3. <strong>Tertiary (Child):</strong> Playful but immature.<br/>
                  4. <strong>Inferior (Grip):</strong> Your stress point.
               </div>
            </div>
         </div>
         <div className="flex flex-col md:flex-row gap-4 justify-around items-center">
            {data.stack.map((fn, i) => (
               <div key={i} className="flex flex-col items-center relative group w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm mb-2 ${i === 0 ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' : i === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
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

      {/* Details Grid */}
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

      {/* Famous People Card */}
      <Card className="bg-white border-slate-100">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} /> Famous Kindred Spirits
         </h3>
         <p className="text-xs text-slate-500 mb-4">
            Others who have walked the path of the {currentTypeString}.
         </p>
         <div className="flex flex-wrap gap-2">
            {data.famous.length > 0 ? data.famous.map((person, i) => (
               <span key={i} className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-600 rounded-lg text-xs font-bold cursor-default">
                  {person}
               </span>
            )) : (
               <span className="text-sm text-slate-400 italic">Famous figures for this type coming soon...</span>
            )}
         </div>
      </Card>

    </div>
  );
};

const LifePathView = ({ lifePathData, birthDate, setBirthDate }) => {
  const meaning = LIFE_PATH_MEANINGS[lifePathData.number] || LIFE_PATH_MEANINGS[0] || {};
  const { breakdown, compound } = lifePathData;
  const compoundMeaning = COMPOUND_MEANINGS[compound] || null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* 1. HERO HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col justify-center items-start gap-1">
          <h3 className="text-lrg text-indigo-600 font-bold uppercase tracking-widest">A Pattern Lens, Not a Prediction</h3>
          <div className="flex items-center w-full">
             <div className="flex flex-row items-baseline gap-3">
               <span className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                  Input your birth date <ArrowRight size={12} />
               </span>
               <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <input 
                      type="date" 
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-slate-800 font-bold focus:ring-0 cursor-pointer text-lg"
                  />
               </div>
             </div>
          </div>
        </div>

        <div className="p-5 grid md:grid-cols-5 gap-8 items-start">
           <div className="md:col-span-3">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Life Path {lifePathData.number}</h1>
              <h2 className="text-xl text-indigo-600 font-medium mb-4">{meaning.title}</h2>
              {/* --- COMPOUND NUMBER SECTION --- */}
              {compoundMeaning && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800">
                     <Gem size={14} className="text-indigo-500" />
                     <span className="text-xs font-bold uppercase tracking-wide">
                        {compound} / {lifePathData.number}: {compoundMeaning}
                     </span>
                  </div>
              )}
              <p className="text-slate-600 leading-relaxed mb-6">{meaning.description}</p>
              
              {/* Expanded Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex gap-3">
                    <div className="mt-1 text-indigo-500"><Target size={18} /></div>
                    <div>
                       <h4 className="text-xs font-bold text-slate-900 uppercase">Primary System Pressure</h4>
                       <p className="text-sm text-slate-600">{meaning.purpose}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="mt-1 text-rose-500"><Heart size={18} /></div>
                    <div>
                       <h4 className="text-xs font-bold text-slate-900 uppercase">Relational Dynamics</h4>
                       <p className="text-sm text-slate-600">{meaning.love}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="mt-1 text-emerald-500"><Briefcase size={18} /></div>
                    <div>
                       <h4 className="text-xs font-bold text-slate-900 uppercase">Professional Landscape</h4>
                       <p className="text-sm text-slate-600">{meaning.career}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* The Algorithm Visual */}
           <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden md:col-span-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-3xl opacity-20 -mr-8 -mt-8"></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Layers size={14} /> The Reduction
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
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xs text-slate-400">
                        {breakdown.rawY.split('').join('+')} = <span className="text-white font-bold">{breakdown.ySum}</span>
                      </div>
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xl font-bold text-indigo-400 w-6 text-right">{breakdown.y}</div>
                   </div>

                   <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                      <div className="text-sm font-mono text-purple-300 w-12">{breakdown.rawM}</div>
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xs text-slate-400">
                         {parseInt(breakdown.rawM) < 10 ? parseInt(breakdown.rawM) : breakdown.rawM.split('').join('+')} 
                         {parseInt(breakdown.rawM) >= 10 && ` = `} 
                         {parseInt(breakdown.rawM) >= 10 && <span className="text-white font-bold">{breakdown.mSum}</span>}
                      </div>
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xl font-bold text-purple-400 w-6 text-right">{breakdown.m}</div>
                   </div>

                   <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                      <div className="text-sm font-mono text-emerald-300 w-12">{breakdown.rawD}</div>
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xs text-slate-400">
                         {parseInt(breakdown.rawD) < 10 ? parseInt(breakdown.rawD) : breakdown.rawD.split('').join('+')}
                         {parseInt(breakdown.rawD) >= 10 && ` = `}
                         {parseInt(breakdown.rawD) >= 10 && <span className="text-white font-bold">{breakdown.dSum}</span>}
                      </div>
                      <ArrowRight size={12} className="text-slate-600" />
                      <div className="text-xl font-bold text-emerald-400 w-6 text-right">{breakdown.d}</div>
                   </div>
                 </div>

                 <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                       {breakdown.y} + {breakdown.m} + {breakdown.d} = <span className="text-white font-bold">{breakdown.y + breakdown.m + breakdown.d}</span>
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
         
         {/* 4. LIGHT & SHADOW */}
         <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-50">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star size={14} /> Constructive Expression
            </h3>
            <ul className="space-y-3">
              {meaning.light && meaning.light.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
         </Card>

         <Card className="bg-slate-50 border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert size={14} /> Common Breakdown Patterns
            </h3>
            <ul className="space-y-3">
              {meaning.shadow_list && meaning.shadow_list.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0"></div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
         </Card>

         {/* 5. FAMOUS PEOPLE */}
         <Card className="bg-white border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Users size={16} /> Famous Kindred Spirits
            </h3>
            <div className="flex flex-wrap gap-2">
               {meaning.famous.length > 0 ? meaning.famous.map((person, i) => (
                  <span key={i} className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-600 rounded-lg text-xs font-bold cursor-default">
                     {person}
                  </span>
               )) : (
                  <span className="text-sm text-slate-400 italic">Famous figures for this type coming soon...</span>
               )}
            </div>
         </Card>

      </div>
    </div>
  );
};

export default function SoulCompassApp() {
  const [view, setView] = useState('lifepath'); 
  // Lifted state from ArchetypesView
  const [mbtiType, setMbtiType] = useState('INFP');
  const [birthDate, setBirthDate] = useState('1986-08-09');
  const [lifePathData, setLifePathData] = useState(() => calculateLifePath('1986-08-09'));
  
  useEffect(() => {
    setLifePathData(calculateLifePath(birthDate));
  }, [birthDate]);

return (
  <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-12">
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setView("lifepath")}
        >
          <img
            src={logo}
            alt="Life Number Pathing"
            className="h-20 w-auto sm:h-20 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
            Life Number Pathing
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100 overflow-x-auto">
          {[
            { id: "lifepath", label: "Life Path" },
            { id: "archetypes", label: "Archetypes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                view === tab.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>

    <main className="max-w-4xl mx-auto px-4 sm:px-6">
      {view === "lifepath" && (
        <LifePathView
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          lifePathData={lifePathData}
        />
      )}

      {view === "archetypes" && (
        <ArchetypesView
          initialType={mbtiType}
          onTypeChange={setMbtiType}
        />
      )}
    </main>
  </div>
);
}