// ============================================================
// 解析小红书健身笔记 → 结构化训练计划
// ------------------------------------------------------------
// 两种运行模式,自动切换:
//
// 1. 开发模式 (npm run dev)
//    前端直接调 DeepSeek,key 从 .env 的 VITE_DEEPSEEK_API_KEY 读取。
//    没配 key → 返回 mock 数据,UI 仍可走通。
//
// 2. 生产模式 (vercel 部署后)
//    前端调本站的 /api/parse,key 在 Vercel 服务端环境变量里,
//    不会暴露给浏览器。/api/parse 由 api/parse.js 实现。
//
// ------------------------------------------------------------
// 本地开发的 .env(前端可见,只用于 dev):
//   VITE_DEEPSEEK_API_KEY=sk-xxx
//   VITE_DEEPSEEK_MODEL=deepseek-chat
//
// Vercel 后端环境变量(服务端,不会进 bundle):
//   DEEPSEEK_API_KEY=sk-xxx
//   DEEPSEEK_MODEL=deepseek-chat
//   INVITE_CODE=xxx           (可选)
//   DAILY_LIMIT=10            (可选)
// ============================================================

const IS_PROD = import.meta.env.PROD;
const DEV_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEV_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';
const DEV_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

// ------- 共享:system prompt(开发模式直连时也要用)-------
const SYS_PROMPT = `你是一名健身教练助理。任务:把用户给的「小红书健身笔记」文字内容,提取成结构化训练计划,以 JSON 对象输出。

字段定义(严格遵守):
{
  "title": "笔记标题,8 个汉字以内,生动简洁",
  "bodyPart": "训练部位,必须是以下之一:胸 | 背 | 腿 | 臀 | 肩 | 手臂 | 核心 | 全身 | 有氧",
  "duration": 25,
  "intensity": "中",
  "equipment": ["哑铃", "瑜伽垫"],
  "exercises": [
    { "name": "哑铃卧推", "sets": 4, "reps": "12 次", "tip": "肩胛收紧,控制下放速度" }
  ]
}

要求:
- 只返回一个合法 JSON 对象,不要任何额外文字。
- exercises 4-8 个为佳。
- 笔记信息不全时,基于常识合理补全,产出可直接跟着练的计划。
- 若内容完全不是健身相关,返回 {"error": "这不是健身笔记噢"}。`;

// ------- Mock 数据(无 key 或失败时降级)-------
const MOCK_RESULTS = [
  {
    title: '今日练胸',
    bodyPart: '胸',
    duration: 45,
    intensity: '高',
    equipment: ['哑铃', '瑜伽垫'],
    exercises: [
      { name: '哑铃卧推', sets: 4, reps: '12 次', tip: '肩胛收紧,控制下放速度' },
      { name: '上斜哑铃飞鸟', sets: 3, reps: '15 次', tip: '微屈肘,感受胸肌发力' },
      { name: '俯卧撑', sets: 3, reps: '力竭', tip: '核心收紧不塌腰' },
      { name: '窄距俯卧撑', sets: 3, reps: '12 次', tip: '肘部贴近身体' },
      { name: '哑铃仰卧上拉', sets: 3, reps: '12 次', tip: '感受胸大肌延展' },
    ],
  },
  {
    title: '蜜桃臀计划',
    bodyPart: '腿',
    duration: 30,
    intensity: '中',
    equipment: ['弹力带'],
    exercises: [
      { name: '臀桥', sets: 4, reps: '20 次', tip: '顶峰夹紧 2 秒' },
      { name: '深蹲', sets: 4, reps: '15 次', tip: '膝盖与脚尖同向' },
      { name: '相扑深蹲', sets: 3, reps: '15 次', tip: '感受大腿内侧' },
      { name: '弓步蹲', sets: 3, reps: '左右各 12', tip: '前脚掌发力' },
      { name: '驴踢腿', sets: 3, reps: '15 次', tip: '腰背挺直' },
    ],
  },
  {
    title: '居家练背',
    bodyPart: '背',
    duration: 25,
    intensity: '中',
    equipment: ['弹力带'],
    exercises: [
      { name: '弹力带划船', sets: 4, reps: '15 次', tip: '夹紧肩胛' },
      { name: '俯身 Y 字举', sets: 3, reps: '12 次', tip: '保持小重量,慢速' },
      { name: '超人式', sets: 3, reps: '20 秒', tip: '下背发力' },
      { name: '反向飞鸟', sets: 3, reps: '15 次', tip: '感受后背收缩' },
    ],
  },
];

function mockParse(input) {
  const text = String(input?.text || '').toLowerCase();
  let pick = MOCK_RESULTS[0];
  if (text.match(/腿|臀|squat|蹲/)) pick = MOCK_RESULTS[1];
  else if (text.match(/背|划船|拉/)) pick = MOCK_RESULTS[2];
  else if (text.match(/胸|卧推|push/)) pick = MOCK_RESULTS[0];
  else pick = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
  return new Promise((resolve) => setTimeout(() => resolve({ ...pick }), 700));
}

function extractJson(rawText) {
  let raw = String(rawText).trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
  return JSON.parse(raw);
}

function normalize(parsed) {
  return {
    title: parsed.title || '未命名训练',
    bodyPart: parsed.bodyPart || '全身',
    duration: Number(parsed.duration) || 30,
    intensity: parsed.intensity || '中',
    equipment: Array.isArray(parsed.equipment) ? parsed.equipment : ['徒手'],
    exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
  };
}

// ------------------------------------------------------------
// 模式 1:开发模式 - 直连 DeepSeek
// ------------------------------------------------------------
async function callDeepSeekDirect(input) {
  if (input.image && !input.text) throw new Error('DEEPSEEK_NO_VISION');

  const res = await fetch(DEV_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${DEV_KEY}`,
    },
    body: JSON.stringify({
      model: DEV_MODEL,
      messages: [
        { role: 'system', content: SYS_PROMPT },
        { role: 'user', content: `这是用户的小红书健身笔记内容,请按系统提示解析:\n\n${input.text || ''}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型返回为空');

  const parsed = extractJson(content);
  if (parsed.error) throw new Error(parsed.error);
  return normalize(parsed);
}

// ------------------------------------------------------------
// 模式 2:生产模式 - 调本站后端 /api/parse
// ------------------------------------------------------------
async function callBackend(input) {
  const inviteCode = localStorage.getItem('practice-up:invite') || '';

  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(inviteCode ? { 'x-invite-code': inviteCode } : {}),
    },
    body: JSON.stringify(input),
  });

  // 401 → 需要邀请码,提示用户输入
  if (res.status === 401) {
    const code = window.prompt('需要邀请码才能用 AI 解析,问问把链接分享给你的朋友 🙋');
    if (code) {
      localStorage.setItem('practice-up:invite', code.trim());
      return callBackend(input); // 重试一次
    }
    throw new Error('已取消');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `服务异常 ${res.status}`);
  }
  return data;
}

// ------------------------------------------------------------
// 对外
// ------------------------------------------------------------
export async function parseNote(input) {
  // 生产:走后端
  if (IS_PROD) {
    try {
      return await callBackend(input);
    } catch (e) {
      console.warn('[api] 后端调用失败,降级到 mock:', e.message);
      const fallback = await mockParse(input);
      fallback.__warning = `AI 解析失败(${e.message}),展示的是 mock 数据`;
      return fallback;
    }
  }

  // 开发:没 key 直接 mock
  if (!DEV_KEY) return mockParse(input);

  // 开发:直连 DeepSeek
  try {
    return await callDeepSeekDirect(input);
  } catch (e) {
    const isVision = e.message === 'DEEPSEEK_NO_VISION';
    if (!isVision) console.warn('[api] DeepSeek 调用失败,降级到 mock:', e.message);
    const fallback = await mockParse(input);
    fallback.__warning = isVision
      ? 'DeepSeek 不支持图片解析,展示的是 mock 数据(可改用文字粘贴)'
      : `AI 解析失败(${e.message}),展示的是 mock 数据`;
    return fallback;
  }
}

// 给 UI 用的标识:生产模式下,key 在后端,前端永远当作"已配好"
export const usingMock = IS_PROD ? false : !DEV_KEY;
export const currentProvider = 'deepseek';
export const currentModel = IS_PROD ? 'deepseek-chat' : DEV_MODEL;
export const supportsVision = false;
