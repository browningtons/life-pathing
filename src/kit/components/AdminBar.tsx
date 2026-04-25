import { Shield, Eye, LogOut } from 'lucide-react';
import { save } from '../persistence';

interface AdminBarProps {
  isPro: boolean;
  viewAs: 'admin' | 'user';
  setViewAs: (v: 'admin' | 'user') => void;
  setIsAdmin: (v: boolean) => void;
}

/**
 * Top bar shown only when the user is admin (5-tap on the logo). Lets the
 * admin switch between viewing as themselves (Pro) and as a free user, and
 * sign out of admin mode.
 */
export default function AdminBar({ isPro, viewAs, setViewAs, setIsAdmin }: AdminBarProps) {
  return (
    <div className="bg-stone-900 text-stone-300 px-4 py-2 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewAs('admin')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors flex items-center gap-1 ${
                viewAs === 'admin'
                  ? 'bg-amber-500 text-stone-900'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Shield size={10} />
              Admin
            </button>
            <button
              onClick={() => setViewAs('user')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors flex items-center gap-1 ${
                viewAs === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Eye size={10} />
              Free User
            </button>
          </div>
          <div
            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
              isPro ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'
            }`}
          >
            {isPro ? 'PRO ACTIVE' : 'FREE TIER'}
          </div>
          <button
            onClick={() => {
              setIsAdmin(false);
              save('admin', false);
              setViewAs('admin');
            }}
            className="p-1 rounded hover:bg-stone-700 transition-colors"
            title="Sign out of admin"
          >
            <LogOut size={12} className="text-stone-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
