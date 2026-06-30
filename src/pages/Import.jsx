import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { parseNote, usingMock, currentProvider, supportsVision } from '../lib/api.js';
import { useStore } from '../lib/store.jsx';

const TABS = [
  { key: 'image', label: '上传截图', emoji: '📸' },
  { key: 'text', label: '粘贴文字', emoji: '📝' },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve({ data: result.slice(comma + 1), type: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Import() {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [imgPreview, setImgPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const { addNote } = useStore();
  const nav = useNavigate();

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgPreview(URL.createObjectURL(file));
    const { data, type } = await fileToBase64(file);
    setImgData({ image: data, imageType: type });
  }

  async function handleParse() {
    setError('');
    setLoading(true);
    try {
      const payload = tab === 'image'
        ? { ...(imgData || {}), text: '请解析这张小红书健身笔记图片。' }
        : { text };
      if (tab === 'image' && !imgData) throw new Error('请先上传图片~');
      if (tab === 'text' && !text.trim()) throw new Error('粘贴点东西呀,空着我也读不出来 😅');
      const data = await parseNote(payload);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    addNote(result);
    nav('/');
  }

  return (
    <div>
      <Header
        title="导入笔记 ✨"
        sub="AI 帮你把小红书笔记拆成动作清单"
      />

      {usingMock && (
        <div className="mx-5 mb-3 text-xs px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
          ⚠️ 没检测到 API Key,正在使用 mock 数据。配置 <code className="text-[11px]">.env</code> 的 <code className="text-[11px]">VITE_DEEPSEEK_API_KEY</code> 可调真实 DeepSeek。
        </div>
      )}

      {!usingMock && tab === 'image' && !supportsVision && (
        <div className="mx-5 mb-3 text-xs px-3 py-2 rounded-xl bg-coral-50 text-coral-700 border border-coral-100">
          📌 当前模型 <code className="text-[11px]">{currentProvider}</code> 暂不支持图片解析,「上传截图」会自动用 mock 数据。要识图请用「粘贴文字」,或换 Claude / GPT-4o 等多模态模型。
        </div>
      )}

      <div className="px-5">
        <div className="flex gap-2 mb-3 bg-coral-50 p-1 rounded-xl2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setResult(null); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.key ? 'bg-white text-coral-600 shadow-soft' : 'text-sub'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {tab === 'image' ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/5] rounded-xl2 bg-white border-2 border-dashed border-coral-200 flex flex-col items-center justify-center text-sub overflow-hidden"
            >
              {imgPreview ? (
                <img src={imgPreview} alt="预览" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-4xl mb-2">📸</span>
                  <span className="text-sm">点这里选健身笔记截图</span>
                  <span className="text-xs mt-1 opacity-70">支持 jpg / png</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="把小红书笔记内容粘贴到这里,标题、文案、动作清单都丢进来就行~"
            className="w-full min-h-[200px] rounded-xl2 bg-white p-4 text-sm shadow-soft border border-coral-100 focus:outline-none focus:border-coral-400 resize-none"
          />
        )}

        {error && <p className="mt-3 text-sm text-coral-600">{error}</p>}

        <button
          onClick={handleParse}
          disabled={loading}
          className="mt-4 w-full py-3.5 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card disabled:opacity-60"
        >
          {loading ? '🤖 解析中…' : '🚀 让 AI 解析'}
        </button>

        {result && (
          <section className="mt-6 animate-pop">
            <p className="text-xs text-sub mb-2">✨ 解析结果,确认无误后保存:</p>
            <div className="rounded-xl2 bg-white p-4 shadow-card border border-coral-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>💪</span><span>{result.title}</span>
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <Tag>{result.bodyPart}</Tag>
                <Tag>{result.duration} 分钟</Tag>
                <Tag>{result.intensity} 强度</Tag>
                {(result.equipment || []).map((eq) => (
                  <Tag key={eq} tone="grey">{eq}</Tag>
                ))}
              </div>

              {result.__warning && (
                <p className="mt-2 text-[11px] px-2 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                  ⚠️ {result.__warning}
                </p>
              )}

              <ul className="mt-3 divide-y divide-coral-50">
                {(result.exercises || []).map((a, i) => (
                  <li key={i} className="py-2.5">
                    <p className="text-sm font-medium">
                      <span className="text-coral-500 mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                      {a.name}
                      <span className="ml-2 text-xs text-sub">{a.sets} 组 × {a.reps}</span>
                    </p>
                    {a.tip && <p className="text-xs text-sub mt-1">💡 {a.tip}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setResult(null)}
                className="py-3 rounded-xl2 bg-white text-ink border border-coral-100 font-medium"
              >
                重来一次
              </button>
              <button
                onClick={handleSave}
                className="py-3 rounded-xl2 bg-coral-500 text-white font-semibold shadow-card"
              >
                ✅ 保存并排期
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Tag({ children, tone = 'coral' }) {
  const cls = tone === 'coral'
    ? 'bg-coral-50 text-coral-600'
    : 'bg-gray-100 text-sub';
  return <span className={`px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}
