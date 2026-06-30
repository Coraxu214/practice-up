// ============================================================
// Vercel Serverless Function:POST /api/parse
// 前端调它,它再调 DeepSeek。key 留在服务端,不会泄露。
// ------------------------------------------------------------
// 在 Vercel Dashboard → Settings → Environment Variables 配置:
//   DEEPSEEK_API_KEY=sk-xxx          (必填)
//   DEEPSEEK_MODEL=deepseek-chat      (可选,默认 deepseek-chat)
//   INVITE_CODE=xxx                   (可选,设了就强制邀请码)
//   DAILY_LIMIT=10                    (可选,默认 10,每 IP 每天上限)
// ============================================================

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

// ---- 简易内存 IP 限频(冷启动会重置,best-effort)----
// 量大时建议换 Upstash Redis / Vercel KV
const ipBuckets = new Map();
const DAY_MS = 24 * 60 * 60 * 1000;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers['x-real-ip'] || 'unknown';
}

function rateLimit(ip, limit) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + DAY_MS });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

function extractJson(rawText) {
  let raw = String(rawText).trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // 1. 限频
  const ip = getClientIp(req);
  const limit = Number(process.env.DAILY_LIMIT) || 10;
  const r = rateLimit(ip, limit);
  if (!r.ok) {
    const mins = Math.ceil(r.retryAfter / 60000);
    return res.status(429).json({
      error: `今天已经用了 ${limit} 次啦,${mins} 分钟后再试 🛌`,
    });
  }

  // 2. 邀请码(可选)
  const requiredCode = process.env.INVITE_CODE;
  if (requiredCode) {
    const provided = req.headers['x-invite-code'];
    if (provided !== requiredCode) {
      return res.status(401).json({ error: '需要邀请码,问问把链接分享给你的朋友 🙋' });
    }
  }

  // 3. 校验入参
  const { text, image } = req.body || {};
  if (!text && !image) {
    return res.status(400).json({ error: '没有内容可解析' });
  }
  if (image && !text) {
    return res.status(400).json({ error: 'DeepSeek 暂不支持图片解析,请粘贴文字' });
  }

  // 4. 调 DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  if (!apiKey) {
    return res.status(500).json({ error: '服务端未配置 DEEPSEEK_API_KEY' });
  }

  try {
    const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYS_PROMPT },
          {
            role: 'user',
            content: `这是用户的小红书健身笔记内容,请按系统提示解析:\n\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!dsRes.ok) {
      const body = await dsRes.text().catch(() => '');
      return res.status(502).json({
        error: `DeepSeek 返回错误 ${dsRes.status}: ${body.slice(0, 200)}`,
      });
    }

    const data = await dsRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: '模型返回为空' });

    const parsed = extractJson(content);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    return res.status(200).json({
      title: parsed.title || '未命名训练',
      bodyPart: parsed.bodyPart || '全身',
      duration: Number(parsed.duration) || 30,
      intensity: parsed.intensity || '中',
      equipment: Array.isArray(parsed.equipment) ? parsed.equipment : ['徒手'],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      __remaining: r.remaining,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || '未知错误' });
  }
}
