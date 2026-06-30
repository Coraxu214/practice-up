import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useStore, todayKey } from '../lib/store.jsx';

export default function Today() {
  const { state, toggleAction, checkIn } = useStore();
  const nav = useNavigate();
  const key = todayKey();
  const item = state.schedule[key];
  const note = item?.noteId ? state.notes.find((n) => n.id === item.noteId) : null;

  if (!item || item.rest || !note) {
    return (
      <div>
        <Header title="今日训练 💪" sub={item?.rest ? '今天休息日,养精蓄锐' : '还没排好计划'} />
        <div className="px-5 mt-6">
          <div className="rounded-xl2 bg-white p-6 text-center shadow-soft">
            <div className="text-4xl mb-2">{item?.rest ? '🛌' : '🍃'}</div>
            <p className="text-sm text-sub">
              {item?.rest
                ? '休息也是训练的一部分,明天见 👋'
                : '先去导入一条笔记,让 AI 给你排课吧。'}
            </p>
            {!item?.rest && (
              <button
                onClick={() => nav('/import')}
                className="mt-4 px-5 py-2.5 rounded-full bg-coral-500 text-white text-sm font-semibold"
              >
                ✨ 去导入
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const done = new Set(item.doneActions || []);
  const total = note.exercises?.length || 0;
  const finished = done.size;
  const allDone = total > 0 && finished === total;
  const progress = total ? Math.round((finished / total) * 100) : 0;

  return (
    <div>
      <Header
        title={note.title}
        sub={`${item.bodyPart} · ${item.duration} 分钟 · ${item.intensity} 强度`}
      />

      <section className="mx-5 rounded-xl2 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between text-xs text-sub">
          <span>进度</span>
          <span>{finished}/{total} ({progress}%)</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-coral-50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-coral-400 to-coral-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {item.checkedIn && (
          <p className="mt-2 text-xs text-emerald-600 font-medium">✅ 今天已打卡,牛的!</p>
        )}
      </section>

      <ul className="mt-4 px-5 space-y-3">
        {(note.exercises || []).map((a, i) => {
          const checked = done.has(i);
          return (
            <li key={i}>
              <button
                onClick={() => toggleAction(key, i)}
                className={`w-full text-left rounded-xl2 p-4 shadow-soft transition active:scale-[0.99] flex items-start gap-3 ${
                  checked ? 'bg-coral-50' : 'bg-white'
                }`}
              >
                <span
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                    checked
                      ? 'bg-coral-500 border-coral-500 text-white'
                      : 'border-coral-200 text-coral-300'
                  }`}
                >
                  {checked ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${checked ? 'line-through text-sub' : ''}`}>
                    {a.name}
                    <span className="ml-2 text-xs text-sub font-normal">
                      {a.sets} 组 × {a.reps}
                    </span>
                  </p>
                  {a.tip && (
                    <p className={`text-xs mt-1 ${checked ? 'text-sub/70' : 'text-sub'}`}>
                      💡 {a.tip}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-5 mt-6 pb-4">
        {item.checkedIn ? (
          <button
            onClick={() => nav(`/share/${key}`)}
            className="w-full py-3.5 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card"
          >
            🎉 查看今日战绩
          </button>
        ) : (
          <button
            disabled={!allDone}
            onClick={() => {
              checkIn(key);
              nav(`/share/${key}`);
            }}
            className="w-full py-3.5 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card disabled:opacity-40 disabled:bg-coral-300"
          >
            {allDone ? '🔥 全部完成,打卡!' : `还差 ${total - finished} 个动作`}
          </button>
        )}
      </div>
    </div>
  );
}
