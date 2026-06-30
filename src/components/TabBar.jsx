import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '首页', emoji: '🏠' },
  { to: '/today', label: '今日', emoji: '💪' },
  { to: '/import', label: '导入', emoji: '✨' },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white/95 backdrop-blur border-t border-coral-100 z-30">
      <ul className="grid grid-cols-3 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {tabs.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-xs transition-colors ${
                  isActive ? 'text-coral-600 font-semibold' : 'text-sub'
                }`
              }
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
