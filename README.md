# 练起来 💪

把小红书收藏的健身笔记,变成跟着练的训练计划。

Vite + React + Tailwind,后端用 Vercel Serverless Function 代理 DeepSeek。

---

## 本地开发

```bash
npm install
cp .env.example .env       # 编辑 .env 填入 VITE_DEEPSEEK_API_KEY
npm run dev                 # http://localhost:5173
```

本地模式下,前端**直接**调 DeepSeek,key 来自 `.env`。没配 key 也能跑(走 mock 数据)。

> 想在手机访问:`npm run dev` 已加 `--host`,看终端打印的 Network 地址,确保手机和电脑同 WiFi。

---

## 部署到 Vercel(让所有人都能用)

> 整个流程大概 5 分钟。需要 GitHub 账号 + DeepSeek API key。

### 1. 推到 GitHub

```bash
cd practice-up
# 如果还没初始化 git:
git init
git add .
git commit -m "init: 练起来 v1"

# 在 https://github.com/new 创建一个空仓库(比如叫 practice-up)
# 复制它给的命令,通常是:
git remote add origin git@github.com:你的用户名/practice-up.git
git branch -M main
git push -u origin main
```

### 2. 导入到 Vercel

1. 打开 https://vercel.com/new
2. 选 **Import Git Repository** → 找到 `practice-up`
3. 框架会自动识别为 Vite
4. **重要**:展开 **Environment Variables**,加几条:

| 变量名 | 值 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | `sk-xxx` | 必填,你的 DeepSeek key,**注意没有 VITE_ 前缀**(只给服务端用) |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 可选,留空也是默认值 |
| `DAILY_LIMIT` | `10` | 可选,每个 IP 每天能用几次,默认 10 |
| `INVITE_CODE` | `lianqilai2026` | 可选,设了就要求访问者输入邀请码;不设就纯靠 IP 限频 |

5. 点 **Deploy**,等 1-2 分钟,拿到 `https://practice-up-xxx.vercel.app` 这种地址,把它发给朋友就行。

### 3. 防滥用

- **IP 限频**:每个 IP 每天 10 次(可调 `DAILY_LIMIT` 环境变量)。
- **邀请码(可选)**:Vercel 设置 `INVITE_CODE`,访问者首次解析时会被提示输入。
- **冷启动重置**:限频用的是 Serverless 函数的内存,函数冷启动会清零,所以是"软限制"。流量大想要真限频,把 `api/parse.js` 里的 `ipBuckets` 换成 [Upstash Redis](https://upstash.com/) 或 [Vercel KV](https://vercel.com/storage/kv)。

### 4. 改环境变量后

Vercel 改完环境变量后,要去 **Deployments** 找到最新一条 → 右上角 **Redeploy** 才会生效。

### 5. 自定义域名(可选)

Vercel → 项目 → **Settings → Domains** → 加你买的域名,按提示配 DNS 即可。

---

## 项目结构

```
practice-up/
├── api/
│   └── parse.js          # Vercel Serverless,后端调 DeepSeek
├── src/
│   ├── App.jsx           # 路由
│   ├── components/       # TabBar, Header
│   ├── pages/            # Home, Import, Today, Share
│   └── lib/
│       ├── api.js        # 前端:dev 直连 / prod 调 /api/parse
│       ├── store.jsx     # Context + localStorage
│       ├── scheduler.js  # AI 排期算法
│       └── date.js
├── vercel.json
├── .env.example          # 本地开发用(VITE_ 前缀)
└── .env                  # 你自己的(已 gitignore)
```

---

## ⚠️ 安全须知

- **不要**把 `.env` 提交到 git(`.gitignore` 已挡)
- **不要**在前端代码里硬编码 key,生产部署一律走 `/api/parse`
- DeepSeek key 如果在聊天 / 截图 / 公开仓库里泄露过,**立刻去 console 吊销**

---

## 常见问题

**Q: 部署后访问 404?**
A: Vercel 没识别到 SPA 路由。`vercel.json` 已经写了 rewrites,如果还有问题 redeploy 一次。

**Q: 调用很慢 / 超时?**
A: Vercel Hobby 计划函数超时 10s,DeepSeek 通常 3-5s 没问题。如果 timeout,换更快的模型或精简 prompt。

**Q: 想换成 OpenAI / Claude / Kimi?**
A: 改 `api/parse.js` 里的 endpoint、headers、body 格式即可(都是 OpenAI 兼容协议比较类似),前端不用动。
