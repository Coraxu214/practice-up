import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useStore } from '../lib/store.jsx';

const QUIPS = [
  '今天的我,又战胜了昨天的我 💅',
  '汗水是最好的滤镜 ✨',
  '别人在刷剧,我在刷脂肪 🔥',
  '练完世界都安静了,只剩心跳和爽 💖',
  '管住嘴,迈开腿,下一个就是我 🍑',
];

export default function Share() {
  const { date } = useParams();
  const nav = useNavigate();
  const { state } = useStore();
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const item = state.schedule[date];
  const note = item?.noteId ? state.notes.find((n) => n.id === item.noteId) : null;
  const quip = QUIPS[(date?.charCodeAt(date.length - 1) || 0) % QUIPS.length];

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#fffaf6',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `今日战绩-${date}.png`;
      a.click();
    } catch (e) {
      alert('导出失败:' + e.message);
    } finally {
      setExporting(false);
    }
  }

  if (!item || !note) {
    return (
      <div className="px-5 pt-10 text-center text-sub">
        没找到这天的训练记录 🙈
        <button onClick={() => nav('/')} className="block mx-auto mt-4 text-coral-600 text-sm">
          ← 回首页
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <button onClick={() => nav(-1)} className="text-sub text-sm">← 返回</button>
        <span className="text-xs text-sub">今日战绩</span>
      </div>

      <div className="px-5">
        <div
          ref={cardRef}
          className="rounded-[28px] bg-white overflow-hidden shadow-card border border-coral-100"
        >
          {/* 顶部渐变 banner */}
          <div className="bg-gradient-to-br from-coral-500 via-coral-400 to-pink-400 p-5 text-white relative">
            <div className="absolute top-3 right-4 text-[10px] tracking-widest opacity-80">PRACTICE UP</div>
            <p className="text-xs opacity-90">{date}</p>
            <p className="mt-2 text-3xl font-extrabold leading-tight">{note.title}</p>
            <p className="mt-1 text-sm opacity-90">{item.bodyPart} · {item.duration} 分钟</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat top={state.streak.count} bot="🔥 连续天数" />
              <Stat top={note.exercises?.length || 0} bot="💪 动作数" />
              <Stat top={item.intensity} bot="⚡ 强度" />
            </div>
          </div>

          {/* 动作列表 */}
          <div className="p-5">
            <p className="text-sm font-semibold text-ink mb-2">✅ 今日已完成</p>
            <ul className="space-y-1.5">
              {(note.exercises || []).map((a, i) => (
                <li key={i} className="text-sm flex items-baseline gap-2">
                  <span className="text-coral-500 font-bold text-xs">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-ink">{a.name}</span>
                  <span className="text-xs text-sub">{a.sets}×{a.reps}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 p-3 rounded-xl bg-coral-50 text-coral-700 text-sm leading-relaxed">
              {quip}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-sub">由「练起来」生成 💪</p>
              <p className="text-[11px] text-sub">@练起来_App</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => nav('/')}
          className="py-3 rounded-xl2 bg-white text-ink border border-coral-100 font-medium"
        >
          回首页
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="py-3 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card disabled:opacity-60"
        >
          {exporting ? '生成中…' : '📥 导出图片'}
        </button>
      </div>
    </div>
  );
}

function Stat({ top, bot }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-xl py-2">
      <p className="text-xl font-bold leading-none">{top}</p>
      <p className="text-[10px] opacity-90 mt-1">{bot}</p>
    </div>
  );
}
