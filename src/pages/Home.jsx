import { useNavigate } from 'react-router-dom';
import { useStore, todayKey } from '../lib/store.jsx';
import { weekDays } from '../lib/date.js';
import Header from '../components/Header.jsx';

const PART_EMOJI = {
  胸: '🫁',
  背: '🦾',
  腿: '🦵',
  臀: '🍑',
  肩: '💪',
  手臂: '💪',
  核心: '🔥',
  全身: '✨',
  有氧: '🏃',
};

export default function Home() {
  const { state, reshuffle } = useStore();
  const nav = useNavigate();
  const days = weekDays();
  const today = todayKey();

  const totalNotes = state.notes.length;

  return (
    <div className="px-1">
      <Header
        title="练起来 💪"
        sub="把收藏的笔记,变成跟着练的计划"
        right={
          <button
            onClick={reshuffle}
            disabled={!totalNotes}
            className="text-xs px-3 py-1.5 rounded-full bg-coral-50 text-coral-600 disabled:opacity-40"
          >
            🎲 重排
          </button>
        }
      />

      {/* 连续打卡 */}
      <section className="mx-5 mt-2 rounded-xl2 bg-gradient-to-br from-coral-500 to-coral-400 text-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs/relaxed opacity-90">连续打卡</p>
            <p className="mt-1">
              <span className="text-5xl font-extrabold tracking-tight">{state.streak.count}</span>
              <span className="ml-1 text-lg">天 🔥</span>
            </p>
          </div>
          <div className="text-right text-xs opacity-90 leading-relaxed">
            <p>已导入 {totalNotes} 条笔记</p>
            <p>最后打卡:{state.streak.lastDate || '—'}</p>
          </div>
        </div>
        <p className="mt-3 text-xs opacity-90">
          {state.streak.count >= 7
            ? '已经一周啦,你就是自律本人!'
            : state.streak.count >= 3
            ? '在路上了,稳住别浪!'
            : '今天动起来,把姐妹们卷哭 💅'}
        </p>
      </section>

      {/* 本周计划 */}
      <section className="mt-6 px-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold">本周计划</h2>
          <span className="text-xs text-sub">{totalNotes === 0 ? '先去导入一条笔记吧' : 'AI 已自动排好'}</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {days.map((d) => {
            const item = state.schedule[d.key];
            const isToday = d.key === today;
            const isRest = item?.rest || !item?.noteId;
            const note = item?.noteId ? state.notes.find((n) => n.id === item.noteId) : null;
            return (
              <button
                key={d.key}
                onClick={() => {
                  if (isToday && !isRest) nav('/today');
                }}
                className={`group text-left rounded-xl2 bg-white p-4 shadow-soft border transition active:scale-[0.99] ${
                  isToday ? 'border-coral-400 ring-2 ring-coral-200' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs ${
                    isToday ? 'bg-coral-500 text-white' : 'bg-coral-50 text-coral-600'
                  }`}>
                    <span className="text-[10px] font-semibold">{d.label}</span>
                    <span className="text-base font-bold leading-none">{d.date}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {isRest ? (
                      <>
                        <p className="text-sm font-semibold">休息日 🛌</p>
                        <p className="text-xs text-sub mt-0.5">放松一下,肌肉也要回血~</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <span>{PART_EMOJI[item.bodyPart] || '💪'}</span>
                          <span>{note?.title || '今日训练'}</span>
                        </p>
                        <p className="text-xs text-sub mt-0.5">
                          {item.bodyPart} · {item.duration} 分钟 · {item.intensity} 强度
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-xs">
                    {item?.checkedIn ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">已完成 ✅</span>
                    ) : isToday && !isRest ? (
                      <span className="px-2 py-1 rounded-full bg-coral-500 text-white">去训练 →</span>
                    ) : isRest ? null : (
                      <span className="text-sub">待办</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {totalNotes === 0 && (
        <button
          onClick={() => nav('/import')}
          className="mx-5 mt-6 w-[calc(100%-2.5rem)] py-3.5 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card"
        >
          ✨ 导入第一条笔记
        </button>
      )}
    </div>
  );
}
